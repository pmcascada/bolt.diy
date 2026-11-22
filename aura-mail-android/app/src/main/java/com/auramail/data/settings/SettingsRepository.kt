package com.auramail.data.settings

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore("aura_settings")

enum class AiModel(val id: String, val label: String, val description: String) {
    OPUS("claude-opus-5-5", "Claude Opus 5.5", "Máxima qualidade de escrita"),
    SONNET("claude-sonnet-5-5", "Claude Sonnet 5.5", "Equilíbrio entre velocidade e qualidade"),
    HAIKU("claude-haiku-5-5", "Claude Haiku 5.5", "Mais rápido e económico"),
}

data class UserSettings(
    val model: AiModel = AiModel.OPUS,
    val speechLanguage: String = "pt-PT",
    val signature: String = "",
    val writingStyle: String = "",
    val themeMode: String = "system",
)

class SettingsRepository(context: Context) {

    private val store = context.dataStore

    /** A chave da API é guardada cifrada (Android Keystore) e excluída dos backups. */
    private val secure = EncryptedSharedPreferences.create(
        context, "aura_secure_prefs",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    private val _apiKey = MutableStateFlow(secure.getString(KEY_API, "").orEmpty())
    val apiKey: StateFlow<String> = _apiKey

    fun setApiKey(key: String) {
        secure.edit().putString(KEY_API, key.trim()).apply()
        _apiKey.value = key.trim()
    }

    val settings: Flow<UserSettings> = store.data.map { p ->
        UserSettings(
            model = p[MODEL]?.let { id -> AiModel.entries.firstOrNull { it.id == id } } ?: AiModel.OPUS,
            speechLanguage = p[SPEECH] ?: "pt-PT",
            signature = p[SIGNATURE] ?: "",
            writingStyle = p[STYLE] ?: "",
            themeMode = p[THEME] ?: "system",
        )
    }

    suspend fun update(transform: (UserSettings) -> UserSettings, current: UserSettings) {
        val n = transform(current)
        store.edit { p: androidx.datastore.preferences.core.MutablePreferences ->
            p[MODEL] = n.model.id
            p[SPEECH] = n.speechLanguage
            p[SIGNATURE] = n.signature
            p[STYLE] = n.writingStyle
            p[THEME] = n.themeMode
        }
    }

    private companion object {
        const val KEY_API = "anthropic_api_key"
        val MODEL: Preferences.Key<String> = stringPreferencesKey("model")
        val SPEECH = stringPreferencesKey("speech_lang")
        val SIGNATURE = stringPreferencesKey("signature")
        val STYLE = stringPreferencesKey("writing_style")
        val THEME = stringPreferencesKey("theme")
    }
}
