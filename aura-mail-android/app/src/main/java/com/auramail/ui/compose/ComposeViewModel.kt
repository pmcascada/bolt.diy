package com.auramail.ui.compose

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.auramail.ai.AiAssistant
import com.auramail.ai.ComposeRequest
import com.auramail.ai.RewriteAction
import com.auramail.data.model.EmailDetail
import com.auramail.data.model.OutgoingEmail
import com.auramail.data.templates.EmailTemplate
import com.auramail.di.AppContainer
import com.auramail.speech.SpeechEvent
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class VoiceMode { DICTATE, INSTRUCT }

data class ComposeUiState(
    val to: String = "",
    val cc: String = "",
    val subject: String = "",
    val body: String = "",
    val aiPrompt: String = "",
    val replyTo: EmailDetail? = null,
    val generating: Boolean = false,
    val listening: VoiceMode? = null,
    val partialTranscript: String = "",
    val voiceLevel: Float = 0f,
    val usedTemplates: List<String> = emptyList(),
    val canUndo: Boolean = false,
    val sending: Boolean = false,
    val finished: Boolean = false,
    val message: String? = null,
)

class ComposeViewModel(
    private val c: AppContainer,
    replyToId: String?,
    initialInstruction: String?,
    mailTo: String?,
    templateId: Long?,
) : ViewModel() {

    private val _state = MutableStateFlow(ComposeUiState(to = mailTo.orEmpty()))
    val state: StateFlow<ComposeUiState> = _state.asStateFlow()
    val templates: StateFlow<List<EmailTemplate>> = c.templates.templates.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val aiReady: Boolean get() = c.ai.isConfigured
    val speechAvailable: Boolean get() = c.speech.isAvailable

    private var aiJob: Job? = null
    private var voiceJob: Job? = null
    private val undoStack = ArrayDeque<Pair<String, String>>()

    init {
        viewModelScope.launch {
            if (replyToId != null) {
                runCatching { c.mail.current.get(replyToId) }.onSuccess { e ->
                    val subj = e.summary.subject.let { if (it.startsWith("RE:", true)) it else "RE: $it" }
                    _state.update { it.copy(replyTo = e, to = e.summary.from.address, subject = subj) }
                }
            }
            templateId?.let { id -> c.templates.get(id)?.let { insertTemplate(it) } }
            if (!initialInstruction.isNullOrBlank()) {
                _state.update { it.copy(aiPrompt = initialInstruction) }
                generate()
            }
        }
    }

    fun onTo(v: String) = _state.update { it.copy(to = v) }
    fun onCc(v: String) = _state.update { it.copy(cc = v) }
    fun onSubject(v: String) = _state.update { it.copy(subject = v) }
    fun onBody(v: String) = _state.update { it.copy(body = v) }
    fun onPrompt(v: String) = _state.update { it.copy(aiPrompt = v) }
    fun consumeMessage() = _state.update { it.copy(message = null) }

    private fun snapshot() {
        val s = _state.value
        undoStack.addLast(s.subject to s.body)
        if (undoStack.size > 20) undoStack.removeFirst()
        _state.update { it.copy(canUndo = true) }
    }

    fun undo() {
        val (subj, body) = undoStack.removeLastOrNull() ?: return
        _state.update { it.copy(subject = subj, body = body, canUndo = undoStack.isNotEmpty()) }
    }

    fun stopAi() {
        aiJob?.cancel()
        _state.update { it.copy(generating = false) }
    }

    /** Gera/reescreve o rascunho completo a partir da instrução (texto ou voz). */
    fun generate(forcedTemplate: EmailTemplate? = null) {
        if (!requireAi()) return
        val s = _state.value
        aiJob?.cancel()
        snapshot()
        aiJob = viewModelScope.launch {
            _state.update { it.copy(generating = true) }
            runCatching {
                val context = listOf(s.aiPrompt, s.subject, s.replyTo?.summary?.subject.orEmpty(), s.replyTo?.body?.take(500).orEmpty()).joinToString(" ")
                val relevant = if (forcedTemplate == null) c.templates.relevantFor(context) else emptyList()
                _state.update { it.copy(usedTemplates = (listOfNotNull(forcedTemplate) + relevant).map { t -> t.name }) }
                val req = ComposeRequest(
                    instruction = s.aiPrompt,
                    currentSubject = s.subject.takeUnless { s.replyTo != null && it.startsWith("RE:") }.orEmpty(),
                    currentBody = s.body,
                    replyTo = s.replyTo,
                    templates = relevant,
                    forcedTemplate = forcedTemplate,
                )
                var acc = ""
                c.ai.compose(req).collect { delta ->
                    acc += delta
                    val (subj, body) = AiAssistant.splitDraft(acc)
                    _state.update {
                        it.copy(
                            subject = if (it.replyTo != null) it.subject else subj ?: it.subject,
                            body = body,
                        )
                    }
                }
                forcedTemplate?.let { c.templates.markUsed(it.id) }
                _state.update { it.copy(aiPrompt = "") }
            }.onFailure { e -> if (e !is kotlinx.coroutines.CancellationException) _state.update { it.copy(message = e.message) } }
            _state.update { it.copy(generating = false) }
        }
    }

    fun rewrite(action: RewriteAction) {
        if (!requireAi()) return
        val body = _state.value.body
        if (body.isBlank()) return
        aiJob?.cancel()
        snapshot()
        aiJob = viewModelScope.launch {
            _state.update { it.copy(generating = true, body = "") }
            runCatching {
                c.ai.rewrite(body, action).collect { d -> _state.update { it.copy(body = it.body + d) } }
            }.onFailure { e ->
                _state.update { it.copy(body = body, message = e.message) }
            }
            _state.update { it.copy(generating = false) }
        }
    }

    /** Inserir um modelo tal como está (sem IA). */
    fun insertTemplate(t: EmailTemplate) {
        snapshot()
        _state.update { it.copy(subject = it.subject.ifBlank { t.subject }, body = t.body) }
        viewModelScope.launch { c.templates.markUsed(t.id) }
    }

    /** Guardar o e-mail atual na memória de modelos (a IA generaliza nomes/datas em variáveis). */
    fun saveAsTemplate() {
        val s = _state.value
        if (s.body.isBlank()) return
        viewModelScope.launch {
            val t = if (c.ai.isConfigured) runCatching { c.ai.templatize(s.subject, s.body) }.getOrNull() else null
            c.templates.save(t ?: EmailTemplate(name = s.subject.ifBlank { "Novo modelo" }, subject = s.subject, body = s.body))
            _state.update { it.copy(message = "Guardado nos seus modelos ✨") }
        }
    }

    // ---------------------------------------------------------------- Voz

    fun toggleVoice(mode: VoiceMode, language: String) {
        if (_state.value.listening != null) {
            voiceJob?.cancel()
            _state.update { it.copy(listening = null, partialTranscript = "", voiceLevel = 0f) }
            return
        }
        voiceJob = viewModelScope.launch {
            _state.update { it.copy(listening = mode, partialTranscript = "") }
            c.speech.listen(language).collect { ev ->
                when (ev) {
                    is SpeechEvent.Level -> _state.update { it.copy(voiceLevel = ev.rms) }
                    is SpeechEvent.Partial -> _state.update { it.copy(partialTranscript = ev.text) }
                    is SpeechEvent.Final -> onTranscript(mode, ev.text)
                    is SpeechEvent.Error -> _state.update { it.copy(message = ev.message) }
                    SpeechEvent.Ready -> Unit
                }
            }
            _state.update { it.copy(listening = null, partialTranscript = "", voiceLevel = 0f) }
        }
    }

    private fun onTranscript(mode: VoiceMode, text: String) {
        if (text.isBlank()) return
        when (mode) {
            VoiceMode.INSTRUCT -> {
                _state.update { it.copy(aiPrompt = text) }
                generate()
            }
            VoiceMode.DICTATE -> {
                snapshot()
                val sep = if (_state.value.body.isBlank() || _state.value.body.endsWith("\n")) "" else " "
                _state.update { it.copy(body = it.body + sep + text) }
                // Limpeza opcional do ditado com IA (remove hesitações, pontua)
                if (c.ai.isConfigured) viewModelScope.launch {
                    runCatching { c.ai.cleanDictation(text) }.onSuccess { clean ->
                        _state.update { s -> s.copy(body = s.body.replace(text, clean)) }
                    }
                }
            }
        }
    }

    // ---------------------------------------------------------------- Envio

    private fun outgoing(): OutgoingEmail? {
        val s = _state.value
        val to = s.to.split(',', ';').map { it.trim() }.filter { it.isNotBlank() }
        if (to.isEmpty() || to.any { !it.contains('@') }) {
            _state.update { it.copy(message = "Indique pelo menos um destinatário válido.") }
            return null
        }
        return OutgoingEmail(
            to = to,
            cc = s.cc.split(',', ';').map { it.trim() }.filter { it.isNotBlank() },
            subject = s.subject,
            body = s.body,
            replyToId = s.replyTo?.summary?.id,
        )
    }

    fun send() {
        val email = outgoing() ?: return
        viewModelScope.launch {
            _state.update { it.copy(sending = true) }
            runCatching { c.mail.current.send(email) }
                .onSuccess { _state.update { it.copy(sending = false, finished = true) } }
                .onFailure { e -> _state.update { it.copy(sending = false, message = e.message ?: "Falha no envio") } }
        }
    }

    fun saveDraftAndClose() {
        val s = _state.value
        if (s.body.isBlank() && s.subject.isBlank()) { _state.update { it.copy(finished = true) }; return }
        viewModelScope.launch {
            runCatching {
                c.mail.current.saveDraft(
                    OutgoingEmail(to = s.to.split(',').map { it.trim() }.filter { it.isNotBlank() }, subject = s.subject, body = s.body),
                )
            }
            _state.update { it.copy(finished = true) }
        }
    }

    private fun requireAi(): Boolean {
        if (!c.ai.isConfigured) {
            _state.update { it.copy(message = "Adicione a chave da API Claude nas Definições para usar a IA.") }
            return false
        }
        return true
    }
}
