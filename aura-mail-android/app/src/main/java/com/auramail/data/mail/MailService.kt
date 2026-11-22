package com.auramail.data.mail

import com.auramail.data.auth.AuthManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/** Escolhe o repositório real (Graph) quando há sessão, senão a caixa de demonstração. */
class MailService(
    private val auth: AuthManager,
    private val graph: MailRepository,
    private val demo: MailRepository,
) {
    val isDemo: Flow<Boolean> = auth.account.map { it == null }
    val current: MailRepository get() = if (auth.account.value != null) graph else demo
}
