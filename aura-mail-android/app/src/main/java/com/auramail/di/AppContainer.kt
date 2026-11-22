package com.auramail.di

import android.content.Context
import com.auramail.ai.AiAssistant
import com.auramail.data.auth.AuthManager
import com.auramail.data.graph.GraphApi
import com.auramail.data.mail.DemoMailRepository
import com.auramail.data.mail.GraphMailRepository
import com.auramail.data.mail.MailService
import com.auramail.data.settings.SettingsRepository
import com.auramail.data.settings.UserSettings
import com.auramail.data.templates.AuraDatabase
import com.auramail.data.templates.TemplateRepository
import com.auramail.speech.SpeechInput
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/** Injeção de dependências manual – simples e sem magia. */
class AppContainer(context: Context) {

    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val settingsRepository = SettingsRepository(context)
    val settings: StateFlow<UserSettings> =
        settingsRepository.settings.stateIn(appScope, SharingStarted.Eagerly, UserSettings())

    val auth = AuthManager(context)

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false; encodeDefaults = true }

    private val graphHttp = OkHttpClient.Builder()
        .addInterceptor { chain ->
            // Executa numa thread do OkHttp; o MSAL renova o token silenciosamente se necessário.
            val token = runBlocking { auth.accessToken() }
            chain.proceed(chain.request().newBuilder().header("Authorization", "Bearer $token").build())
        }
        .build()

    private val graphApi: GraphApi = Retrofit.Builder()
        .baseUrl(GraphApi.BASE_URL)
        .client(graphHttp)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(GraphApi::class.java)

    val mail = MailService(auth, GraphMailRepository(graphApi), DemoMailRepository())

    private val database = AuraDatabase.create(context)
    val templates = TemplateRepository(database.templates())

    val ai = AiAssistant(
        apiKeyProvider = { settingsRepository.apiKey.value },
        settingsProvider = { settings.value },
    )

    val speech = SpeechInput(context)
}
