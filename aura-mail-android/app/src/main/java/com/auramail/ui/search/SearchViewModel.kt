package com.auramail.ui.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.auramail.data.model.EmailSummary
import com.auramail.data.model.SearchPlan
import com.auramail.di.AppContainer
import com.auramail.speech.SpeechEvent
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SearchUiState(
    val query: String = "",
    val plan: SearchPlan? = null,
    val results: List<EmailSummary> = emptyList(),
    val searching: Boolean = false,
    val interpreting: Boolean = false,
    val answer: String = "",
    val answering: Boolean = false,
    val submitted: Boolean = false,
    val listening: Boolean = false,
    val voiceLevel: Float = 0f,
    val error: String? = null,
)

class SearchViewModel(private val c: AppContainer) : ViewModel() {

    private val _state = MutableStateFlow(SearchUiState())
    val state: StateFlow<SearchUiState> = _state.asStateFlow()
    val aiReady get() = c.ai.isConfigured

    private var typingJob: Job? = null
    private var searchJob: Job? = null
    private var voiceJob: Job? = null

    val examples = listOf(
        "Faturas com anexo deste mês",
        "O que a Ana pediu sobre a proposta?",
        "Quando é o meu voo para Londres?",
        "E-mails por ler de fornecedores",
        "Reuniões marcadas para esta semana",
    )

    /** Enquanto escreve: resultados instantâneos por palavra-chave (sem IA). */
    fun onQuery(q: String) {
        _state.update { it.copy(query = q, submitted = false, plan = null, answer = "") }
        typingJob?.cancel()
        if (q.isBlank()) { _state.update { it.copy(results = emptyList()) }; return }
        typingJob = viewModelScope.launch {
            delay(350)
            runCatching { c.mail.current.search(SearchPlan(keywords = q.split(" ").filter { it.length > 2 }), q) }
                .onSuccess { r -> _state.update { it.copy(results = r) } }
        }
    }

    /** Ao submeter: a IA interpreta a intenção, aplica filtros e responde a perguntas. */
    fun submit(q: String = _state.value.query) {
        if (q.isBlank()) return
        typingJob?.cancel(); searchJob?.cancel()
        _state.update { it.copy(query = q, submitted = true, searching = true, interpreting = aiReady, answer = "", error = null) }
        searchJob = viewModelScope.launch {
            val repo = c.mail.current
            val plan = if (aiReady) runCatching { c.ai.planSearch(q) }.getOrElse { e ->
                _state.update { it.copy(error = e.message) }
                SearchPlan(keywords = listOf(q))
            } else SearchPlan(keywords = q.split(" ").filter { it.length > 2 })
            _state.update { it.copy(plan = plan, interpreting = false) }

            var results = runCatching { repo.search(plan, q) }.getOrElse { e ->
                _state.update { it.copy(error = e.message) }; emptyList()
            }
            // Se os filtros forem demasiado restritos, alarga para as palavras-chave
            if (results.isEmpty() && plan.keywords.isNotEmpty()) {
                results = runCatching { repo.search(SearchPlan(keywords = plan.keywords), q) }.getOrDefault(emptyList())
            }
            _state.update { it.copy(results = results, searching = false) }

            if (aiReady && plan.isQuestion && results.isNotEmpty()) {
                _state.update { it.copy(answering = true) }
                runCatching {
                    val details = results.take(6).map { repo.get(it.id) }
                    c.ai.answerFromEmails(q, details).collect { d ->
                        _state.update { it.copy(answer = it.answer + d, answering = false) }
                    }
                }.onFailure { e -> _state.update { it.copy(error = e.message) } }
                _state.update { it.copy(answering = false) }
            }
        }
    }

    fun toggleVoice(language: String) {
        if (_state.value.listening) {
            voiceJob?.cancel(); _state.update { it.copy(listening = false) }; return
        }
        voiceJob = viewModelScope.launch {
            _state.update { it.copy(listening = true) }
            c.speech.listen(language).collect { ev ->
                when (ev) {
                    is SpeechEvent.Partial -> _state.update { it.copy(query = ev.text) }
                    is SpeechEvent.Level -> _state.update { it.copy(voiceLevel = ev.rms) }
                    is SpeechEvent.Final -> if (ev.text.isNotBlank()) submit(ev.text)
                    is SpeechEvent.Error -> _state.update { it.copy(error = ev.message) }
                    SpeechEvent.Ready -> Unit
                }
            }
            _state.update { it.copy(listening = false, voiceLevel = 0f) }
        }
    }
}
