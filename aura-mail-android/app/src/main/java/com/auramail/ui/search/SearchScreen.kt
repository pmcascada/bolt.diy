package com.auramail.ui.search

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.expandVertically
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FilterAlt
import androidx.compose.material.icons.rounded.SearchOff
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.ui.components.AiActionChip
import com.auramail.ui.components.AiBadge
import com.auramail.ui.components.AiCard
import com.auramail.ui.components.EmailRow
import com.auramail.ui.components.EmptyState
import com.auramail.ui.components.ThinkingDots
import com.auramail.ui.components.VoiceButton

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SearchScreen(vm: SearchViewModel, speechLanguage: String, startWithVoice: Boolean, onBack: () -> Unit, onOpen: (String) -> Unit) {
    val state by vm.state.collectAsStateWithLifecycle()
    val focus = remember { FocusRequester() }
    val context = LocalContext.current
    val mic = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { if (it) vm.toggleVoice(speechLanguage) }
    fun voice() {
        if (state.listening || ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) vm.toggleVoice(speechLanguage)
        else mic.launch(Manifest.permission.RECORD_AUDIO)
    }
    LaunchedEffect(Unit) { if (startWithVoice) voice() else runCatching { focus.requestFocus() } }

    Scaffold { padding ->
        Column(Modifier.fillMaxSize().padding(bottom = padding.calculateBottomPadding())) {
            Surface(tonalElevation = 2.dp) {
                Row(Modifier.statusBarsPadding().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Voltar") }
                    TextField(
                        value = state.query,
                        onValueChange = vm::onQuery,
                        placeholder = { Text("Pesquise ou faça uma pergunta…") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { vm.submit() }),
                        trailingIcon = {
                            if (state.query.isNotEmpty()) IconButton(onClick = { vm.onQuery("") }) { Icon(Icons.Rounded.Close, "Limpar") }
                        },
                        shape = RoundedCornerShape(28.dp),
                        colors = TextFieldDefaults.colors(focusedIndicatorColor = Color.Transparent, unfocusedIndicatorColor = Color.Transparent),
                        modifier = Modifier.weight(1f).focusRequester(focus),
                    )
                    VoiceButton(listening = state.listening, level = state.voiceLevel, size = 44.dp, onClick = ::voice)
                }
            }
            AnimatedVisibility(state.searching || state.interpreting) { LinearProgressIndicator(Modifier.fillMaxWidth()) }

            LazyColumn(contentPadding = PaddingValues(bottom = 32.dp), modifier = Modifier.fillMaxSize()) {
                if (state.query.isBlank()) {
                    item {
                        Column(Modifier.padding(20.dp)) {
                            AiBadge("Pesquisa inteligente")
                            Spacer(Modifier.height(12.dp))
                            Text(
                                if (vm.aiReady) "Escreva como falaria. A IA percebe datas, remetentes, anexos e até responde a perguntas sobre os seus e-mails."
                                else "Configure a chave Claude nas Definições para ativar a pesquisa em linguagem natural. Até lá, a pesquisa é por palavras-chave.",
                                style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(16.dp))
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                vm.examples.forEach { ex -> AiActionChip(ex, Icons.Rounded.AutoAwesome) { vm.submit(ex) } }
                            }
                        }
                    }
                }

                state.plan?.takeIf { state.submitted }?.let { plan ->
                    item {
                        Column(Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                            if (plan.explanation.isNotBlank()) {
                                Text(plan.explanation, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(Modifier.height(8.dp))
                            }
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                plan.chips().forEach { chip ->
                                    AssistChip(
                                        onClick = {}, label = { Text(chip) },
                                        leadingIcon = { Icon(Icons.Rounded.FilterAlt, null, Modifier.size(AssistChipDefaults.IconSize)) },
                                    )
                                }
                            }
                        }
                    }
                }

                if (state.answering || state.answer.isNotBlank()) {
                    item {
                        AnimatedVisibility(true, enter = fadeIn() + expandVertically()) {
                            AiCard(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
                                AiBadge("Resposta")
                                Spacer(Modifier.height(10.dp))
                                if (state.answering && state.answer.isBlank()) ThinkingDots()
                                else Text(state.answer, style = MaterialTheme.typography.bodyLarge)
                            }
                        }
                    }
                }

                state.error?.let { err ->
                    item { Text(err, Modifier.padding(16.dp), color = MaterialTheme.colorScheme.error) }
                }

                if (state.query.isNotBlank() && state.results.isNotEmpty()) {
                    item {
                        Text(
                            "${state.results.size} resultado(s)",
                            Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    items(state.results, key = { it.id }) { e ->
                        EmailRow(e, onClick = { onOpen(e.id) })
                        HorizontalDivider(Modifier.padding(start = 74.dp))
                    }
                } else if (state.submitted && !state.searching) {
                    item { EmptyState(Icons.Rounded.SearchOff, "Sem resultados", "Experimente reformular ou usar menos filtros.") }
                }
            }
        }
    }
}
