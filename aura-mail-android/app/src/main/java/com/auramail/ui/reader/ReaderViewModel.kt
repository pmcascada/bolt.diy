package com.auramail.ui.reader

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.auramail.ai.AiAssistant
import com.auramail.data.model.EmailDetail
import com.auramail.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ReaderUiState(
    val email: EmailDetail? = null,
    val error: String? = null,
    val insights: AiAssistant.EmailInsights? = null,
    val insightsLoading: Boolean = false,
    val insightsError: String? = null,
    val done: Boolean = false,
)

class ReaderViewModel(private val c: AppContainer, private val id: String) : ViewModel() {

    private val _state = MutableStateFlow(ReaderUiState())
    val state: StateFlow<ReaderUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            runCatching { c.mail.current.get(id) }
                .onSuccess { e ->
                    _state.update { it.copy(email = e) }
                    if (!e.summary.isRead) runCatching { c.mail.current.markRead(id, true) }
                    loadInsights(e)
                }
                .onFailure { e -> _state.update { it.copy(error = e.message) } }
        }
    }

    private fun loadInsights(e: EmailDetail) {
        if (!c.ai.isConfigured) {
            _state.update { it.copy(insightsError = "Configure a chave da API Claude nas Definições para ver o resumo inteligente.") }
            return
        }
        _state.update { it.copy(insightsLoading = true, insightsError = null) }
        viewModelScope.launch {
            runCatching { c.ai.insights(e) }
                .onSuccess { i -> _state.update { it.copy(insights = i, insightsLoading = false) } }
                .onFailure { err -> _state.update { it.copy(insightsLoading = false, insightsError = err.message) } }
        }
    }

    fun retryInsights() { _state.value.email?.let { loadInsights(it) } }

    fun archive() = viewModelScope.launch {
        runCatching { c.mail.current.archive(id) }
        _state.update { it.copy(done = true) }
    }

    fun delete() = viewModelScope.launch {
        runCatching { c.mail.current.delete(id) }
        _state.update { it.copy(done = true) }
    }
}
