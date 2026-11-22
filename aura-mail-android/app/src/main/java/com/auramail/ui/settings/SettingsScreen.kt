package com.auramail.ui.settings

import android.app.Activity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.data.settings.AiModel
import com.auramail.data.settings.UserSettings
import com.auramail.di.AppContainer
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(container: AppContainer, onBack: () -> Unit) {
    val settings by container.settings.collectAsStateWithLifecycle()
    val account by container.auth.account.collectAsStateWithLifecycle()
    val savedKey by container.settingsRepository.apiKey.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val activity = LocalContext.current as Activity
    val snackbar = remember { SnackbarHostState() }
    var key by remember(savedKey) { mutableStateOf(savedKey) }
    var showKey by remember { mutableStateOf(false) }
    var signature by remember(settings.signature) { mutableStateOf(settings.signature) }
    var style by remember(settings.writingStyle) { mutableStateOf(settings.writingStyle) }

    fun update(t: (UserSettings) -> UserSettings) = scope.launch { container.settingsRepository.update(t, settings) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text("Definições") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Voltar") } },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Section("Conta Microsoft 365") {
                if (account != null) {
                    Text("Ligado como ${account!!.username}", style = MaterialTheme.typography.bodyLarge)
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(onClick = { scope.launch { container.auth.signOut() } }) { Text("Terminar sessão") }
                } else if (!container.auth.isConfigured) {
                    Text(
                        "Para ligar o Outlook/Microsoft 365, registe a app no portal Microsoft Entra e preencha o client_id e o redirect_uri em res/raw/msal_config.json (ver README). Até lá está a usar a caixa de demonstração.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    Text("Ligue a sua conta para ler e enviar e-mails reais.", style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = {
                        scope.launch {
                            runCatching { container.auth.signIn(activity) }
                                .onFailure { snackbar.showSnackbar(it.message ?: "Não foi possível iniciar sessão") }
                        }
                    }) { Text("Iniciar sessão com a Microsoft") }
                }
            }

            Section("Inteligência artificial (Claude)") {
                OutlinedTextField(
                    value = key, onValueChange = { key = it },
                    label = { Text("Chave da API Anthropic") },
                    singleLine = true,
                    visualTransformation = if (showKey) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showKey = !showKey }) {
                            Icon(if (showKey) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility, "Mostrar")
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    "Guardada cifrada no dispositivo e nunca incluída em backups. Obtenha uma em platform.claude.com.",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
                Button(enabled = key != savedKey, onClick = {
                    container.settingsRepository.setApiKey(key)
                    scope.launch { snackbar.showSnackbar("Chave guardada") }
                }) { Text("Guardar chave") }
                Spacer(Modifier.height(12.dp))
                Text("Modelo", style = MaterialTheme.typography.titleMedium)
                AiModel.entries.forEach { m ->
                    Row(
                        Modifier.fillMaxWidth().selectable(selected = settings.model == m, onClick = { update { it.copy(model = m) } }).padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(selected = settings.model == m, onClick = null)
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Text(m.label, style = MaterialTheme.typography.bodyLarge)
                            Text(m.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            Section("A sua escrita") {
                OutlinedTextField(
                    value = signature, onValueChange = { signature = it }, label = { Text("Assinatura") },
                    minLines = 2, modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = style, onValueChange = { style = it }, label = { Text("Estilo pessoal") },
                    placeholder = { Text("Ex.: direto, cordial, trato por 'você', frases curtas") },
                    minLines = 2, modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                Button(
                    enabled = signature != settings.signature || style != settings.writingStyle,
                    onClick = { update { it.copy(signature = signature, writingStyle = style) } },
                ) { Text("Guardar") }
            }

            Section("Voz") {
                Text("Idioma do reconhecimento de voz", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(6.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("pt-PT" to "Português (PT)", "pt-BR" to "Português (BR)", "en-US" to "English", "es-ES" to "Español", "fr-FR" to "Français").forEach { (code, label) ->
                        FilterChip(selected = settings.speechLanguage == code, onClick = { update { it.copy(speechLanguage = code) } }, label = { Text(label) })
                    }
                }
            }

            Section("Aparência") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("system" to "Automático", "light" to "Claro", "dark" to "Escuro").forEach { (mode, label) ->
                        FilterChip(selected = settings.themeMode == mode, onClick = { update { it.copy(themeMode = mode) } }, label = { Text(label) })
                    }
                }
            }
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}
