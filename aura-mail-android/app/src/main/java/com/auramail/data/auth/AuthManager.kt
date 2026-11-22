package com.auramail.data.auth

import android.app.Activity
import android.content.Context
import com.auramail.R
import com.microsoft.identity.client.AcquireTokenSilentParameters
import com.microsoft.identity.client.AuthenticationCallback
import com.microsoft.identity.client.IAccount
import com.microsoft.identity.client.IAuthenticationResult
import com.microsoft.identity.client.IPublicClientApplication
import com.microsoft.identity.client.ISingleAccountPublicClientApplication
import com.microsoft.identity.client.PublicClientApplication
import com.microsoft.identity.client.SignInParameters
import com.microsoft.identity.client.SilentAuthenticationCallback
import com.microsoft.identity.client.exception.MsalException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

data class AccountInfo(val username: String)

/**
 * Autenticação Microsoft 365 (Entra ID) com MSAL em modo de conta única.
 * Requer registo da app no portal Entra – ver README.
 */
class AuthManager(private val context: Context) {

    private var app: ISingleAccountPublicClientApplication? = null
    private val _account = MutableStateFlow<AccountInfo?>(null)
    val account: StateFlow<AccountInfo?> = _account

    val isConfigured: Boolean
        get() = context.resources.openRawResource(R.raw.msal_config).bufferedReader()
            .use { it.readText() }.contains("REPLACE_WITH").not()

    private suspend fun client(): ISingleAccountPublicClientApplication {
        app?.let { return it }
        return suspendCancellableCoroutine { cont ->
            PublicClientApplication.createSingleAccountPublicClientApplication(
                context, R.raw.msal_config,
                object : IPublicClientApplication.ISingleAccountApplicationCreatedListener {
                    override fun onCreated(application: ISingleAccountPublicClientApplication) {
                        app = application
                        cont.resume(application)
                    }
                    override fun onError(exception: MsalException) = cont.resumeWithException(exception)
                },
            )
        }
    }

    private suspend fun currentAccount(): IAccount? = suspendCancellableCoroutine { cont ->
        val a = app ?: return@suspendCancellableCoroutine cont.resume(null)
        a.getCurrentAccountAsync(object : ISingleAccountPublicClientApplication.CurrentAccountCallback {
            override fun onAccountLoaded(activeAccount: IAccount?) = cont.resume(activeAccount)
            override fun onAccountChanged(priorAccount: IAccount?, currentAccount: IAccount?) = Unit
            override fun onError(exception: MsalException) = cont.resume(null)
        })
    }

    suspend fun restore() {
        if (!isConfigured) return
        runCatching {
            client()
            _account.value = currentAccount()?.let { AccountInfo(it.username) }
        }
    }

    suspend fun signIn(activity: Activity): AccountInfo {
        val c = client()
        val result = suspendCancellableCoroutine<IAuthenticationResult> { cont ->
            val params = SignInParameters.builder()
                .withActivity(activity)
                .withScopes(SCOPES)
                .withCallback(object : AuthenticationCallback {
                    override fun onSuccess(authenticationResult: IAuthenticationResult) = cont.resume(authenticationResult)
                    override fun onError(exception: MsalException) = cont.resumeWithException(exception)
                    override fun onCancel() = cont.cancel()
                })
                .build()
            c.signIn(params)
        }
        return AccountInfo(result.account.username).also { _account.value = it }
    }

    suspend fun signOut() {
        val c = client()
        suspendCancellableCoroutine { cont ->
            c.signOut(object : ISingleAccountPublicClientApplication.SignOutCallback {
                override fun onSignOut() = cont.resume(Unit)
                override fun onError(exception: MsalException) = cont.resume(Unit)
            })
        }
        _account.value = null
    }

    /** Devolve um access token válido (renovado silenciosamente pelo MSAL). */
    suspend fun accessToken(): String {
        val c = client()
        val acc = currentAccount() ?: error("Sem sessão iniciada")
        return suspendCancellableCoroutine { cont ->
            val params = AcquireTokenSilentParameters.Builder()
                .forAccount(acc)
                .fromAuthority(acc.authority)
                .withScopes(SCOPES)
                .withCallback(object : SilentAuthenticationCallback {
                    override fun onSuccess(authenticationResult: IAuthenticationResult) =
                        cont.resume(authenticationResult.accessToken)
                    override fun onError(exception: MsalException) = cont.resumeWithException(exception)
                })
                .build()
            c.acquireTokenSilentAsync(params)
        }
    }

    companion object {
        val SCOPES = listOf("User.Read", "Mail.ReadWrite", "Mail.Send")
    }
}
