package com.auramail.ui.inbox

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.auramail.di.AppContainer
import com.auramail.data.model.EmailSummary
import com.auramail.data.model.MailFolder
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class InboxUiState(
    val folder: MailFolder = MailFolder.INBOX,
    val emails: List<EmailSummary> = emptyList(),
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val error: String? = null,
    val briefing: String = "",
    val briefingLoading: Boolean = false,
    val briefingVisible: Boolean = false,
)

class InboxViewModel(private val c: AppContainer) : ViewModel() {

    private val _state = MutableStateFlow(InboxUiState())
    val state: StateFlow<InboxUiState> = _state.asStateFlow()
    val isDemo = c.mail.isDemo.stateIn(viewModelScope, SharingStarted.Eagerly, true)
    val account = c.auth.account

    private var briefingJob: Job? = null

    init {
        load()
        // Recarrega quando o utilizador inicia/termina sessão
        viewModelScope.launch { c.auth.account.collect { load() } }
    }

    fun selectFolder(folder: MailFolder) {
        _state.update { it.copy(folder = folder, emails = emptyList()) }
        load()
    }

    fun refresh() = load(refreshing = true)

    private fun load(refreshing: Boolean = false) {
        viewModelScope.launch {
            _state.update { it.copy(loading = !refreshing, refreshing = refreshing, error = null) }
            runCatching { c.mail.current.list(_state.value.folder) }
                .onSuccess { list -> _state.update { it.copy(emails = list, loading = false, refreshing = false) } }
                .onFailure { e -> _state.update { it.copy(loading = false, refreshing = false, error = e.message ?: "Erro ao carregar") } }
        }
    }

    fun archive(email: EmailSummary) = mutate(email) { c.mail.current.archive(email.id) }
    fun delete(email: EmailSummary) = mutate(email) { c.mail.current.delete(email.id) }

    private fun mutate(email: EmailSummary, action: suspend () -> Unit) {
        _state.update { s -> s.copy(emails = s.emails.filterNot { it.id == email.id }) }
        viewModelScope.launch {
            runCatching { action() }.onFailure { e -> _state.update { it.copy(error = e.message) }; load() }
        }
    }

    /** "Briefing" da IA sobre os e-mails por ler. */
    fun toggleBriefing() {
        if (_state.value.briefingVisible) {
            briefingJob?.cancel()
            _state.update { it.copy(briefingVisible = false, briefingLoading = false) }
            return
        }
        _state.update { it.copy(briefingVisible = true, briefingLoading = true, briefing = "") }
        briefingJob = viewModelScope.launch {
            runCatching {
                val repo = c.mail.current
                val pending = _state.value.emails.filter { !it.isRead }.ifEmpty { _state.value.emails }.take(8)
                val details = pending.map { repo.get(it.id) }
                c.ai.answerFromEmails(
                    "Faz-me um briefing curto destes e-mails: primeiro o que é urgente ou tem prazo, depois o que exige resposta, e por fim o que é apenas informativo. Usa tópicos curtos começados por •.",
                    details,
                ).collect { delta -> _state.update { it.copy(briefing = it.briefing + delta, briefingLoading = false) } }
            }.onFailure { e -> _state.update { it.copy(briefing = e.message ?: "Erro", briefingLoading = false) } }
        }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
