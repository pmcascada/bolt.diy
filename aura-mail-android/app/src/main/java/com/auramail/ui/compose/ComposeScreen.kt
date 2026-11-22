package com.auramail.ui.compose

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.automirrored.rounded.Undo
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.BookmarkAdd
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.KeyboardVoice
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Save
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.ai.RewriteAction
import com.auramail.data.templates.EmailTemplate
import com.auramail.ui.components.AiActionChip
import com.auramail.ui.components.AiBadge
import com.auramail.ui.components.ThinkingDots
import com.auramail.ui.components.VoiceButton
import com.auramail.ui.theme.AiGradient

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeScreen(
    vm: ComposeViewModel,
    speechLanguage: String,
    startWithVoice: Boolean,
    onClose: () -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val templates by vm.templates.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val context = LocalContext.current
    var showTemplates by rememberSaveable { mutableStateOf(false) }
    var menuOpen by remember { mutableStateOf(false) }
    var showCc by rememberSaveable { mutableStateOf(false) }
    var pendingVoice by remember { mutableStateOf<VoiceMode?>(null) }

    val micPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val mode = pendingVoice
        if (granted && mode != null) vm.toggleVoice(mode, speechLanguage)
        pendingVoice = null
    }
    fun voice(mode: VoiceMode) {
        if (state.listening != null || ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            vm.toggleVoice(mode, speechLanguage)
        } else {
            pendingVoice = mode
            micPermission.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    LaunchedEffect(Unit) { if (startWithVoice) voice(VoiceMode.INSTRUCT) }
    LaunchedEffect(state.finished) { if (state.finished) onClose() }
    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.consumeMessage() } }
    BackHandler { vm.saveDraftAndClose() }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(if (state.replyTo != null) "Responder" else "Nova mensagem") },
                navigationIcon = { IconButton(onClick = vm::saveDraftAndClose) { Icon(Icons.Rounded.Close, "Fechar e guardar rascunho") } },
                actions = {
                    if (state.canUndo) IconButton(onClick = vm::undo) { Icon(Icons.AutoMirrored.Rounded.Undo, "Desfazer alteração da IA") }
                    IconButton(onClick = { showTemplates = true }) { Icon(Icons.Rounded.Description, "Modelos") }
                    if (state.sending) {
                        CircularProgressIndicator(Modifier.size(24.dp).padding(2.dp), strokeWidth = 2.dp)
                    } else {
                        FilledIconButton(onClick = vm::send, enabled = !state.generating) {
                            Icon(Icons.AutoMirrored.Rounded.Send, "Enviar")
                        }
                    }
                    IconButton(onClick = { menuOpen = true }) { Icon(Icons.Rounded.MoreVert, "Mais") }
                    DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                        DropdownMenuItem(
                            text = { Text("Guardar como modelo") },
                            leadingIcon = { Icon(Icons.Rounded.BookmarkAdd, null) },
                            onClick = { menuOpen = false; vm.saveAsTemplate() },
                        )
                        DropdownMenuItem(
                            text = { Text("Guardar rascunho") },
                            leadingIcon = { Icon(Icons.Rounded.Save, null) },
                            onClick = { menuOpen = false; vm.saveDraftAndClose() },
                        )
                        DropdownMenuItem(
                            text = { Text(if (showCc) "Ocultar Cc" else "Adicionar Cc") },
                            onClick = { menuOpen = false; showCc = !showCc },
                        )
                    }
                },
            )
        },
        bottomBar = {
            AiComposerBar(
                state = state,
                hasBody = state.body.isNotBlank(),
                onPrompt = vm::onPrompt,
                onGenerate = { vm.generate() },
                onStop = vm::stopAi,
                onRewrite = vm::rewrite,
                onVoiceInstruct = { voice(VoiceMode.INSTRUCT) },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            AnimatedVisibility(state.generating) { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                PlainField("Para", state.to, vm::onTo, KeyboardType.Email)
                if (showCc) PlainField("Cc", state.cc, vm::onCc, KeyboardType.Email)
                PlainField("Assunto", state.subject, vm::onSubject)
                if (state.usedTemplates.isNotEmpty()) {
                    Text(
                        "Modelos de referência: " + state.usedTemplates.joinToString(),
                        Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary,
                        maxLines = 1, overflow = TextOverflow.Ellipsis,
                    )
                }
                Box {
                    TextField(
                        value = state.body,
                        onValueChange = vm::onBody,
                        placeholder = { Text("Escreva, dite 🎙️ ou peça à IA em baixo…") },
                        modifier = Modifier.fillMaxWidth().padding(end = 96.dp),
                        minLines = 10,
                        colors = transparentFieldColors(),
                        textStyle = MaterialTheme.typography.bodyLarge,
                    )
                    // Botão de ditado, no canto do corpo
                    Surface(
                        onClick = { voice(VoiceMode.DICTATE) },
                        shape = RoundedCornerShape(50),
                        color = if (state.listening == VoiceMode.DICTATE) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surfaceContainer,
                        modifier = Modifier.align(Alignment.TopEnd).padding(8.dp),
                    ) {
                        Row(Modifier.padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(if (state.listening == VoiceMode.DICTATE) Icons.Rounded.Stop else Icons.Rounded.KeyboardVoice, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(if (state.listening == VoiceMode.DICTATE) "Parar" else "Ditar", style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
                state.replyTo?.let { r ->
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                    Text(
                        "Em ${r.summary.from.display} escreveu:\n" + r.body.lines().take(6).joinToString("\n") { "> $it" },
                        Modifier.padding(16.dp), style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        // Overlay de voz em ecrã com transcrição em tempo real
        VoiceOverlay(state, onStop = { state.listening?.let { vm.toggleVoice(it, speechLanguage) } })
    }

    if (showTemplates) {
        TemplatePickerSheet(
            templates = templates,
            onDismiss = { showTemplates = false },
            onUseWithAi = { showTemplates = false; vm.generate(forcedTemplate = it) },
            onInsert = { showTemplates = false; vm.insertTemplate(it) },
        )
    }
}

@Composable
private fun PlainField(label: String, value: String, onChange: (String) -> Unit, keyboard: KeyboardType = KeyboardType.Text) {
    TextField(
        value = value, onValueChange = onChange,
        leadingIcon = { Text(label, Modifier.padding(start = 16.dp), color = MaterialTheme.colorScheme.onSurfaceVariant) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboard),
        modifier = Modifier.fillMaxWidth(),
        colors = transparentFieldColors(),
    )
    HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
}

@Composable
private fun transparentFieldColors() = TextFieldDefaults.colors(
    focusedContainerColor = Color.Transparent,
    unfocusedContainerColor = Color.Transparent,
    focusedIndicatorColor = Color.Transparent,
    unfocusedIndicatorColor = Color.Transparent,
)

/** Barra de IA fixa em baixo: ações rápidas + instrução por texto ou voz. */
@Composable
private fun AiComposerBar(
    state: ComposeUiState,
    hasBody: Boolean,
    onPrompt: (String) -> Unit,
    onGenerate: () -> Unit,
    onStop: () -> Unit,
    onRewrite: (RewriteAction) -> Unit,
    onVoiceInstruct: () -> Unit,
) {
    Surface(tonalElevation = 4.dp, shadowElevation = 8.dp, shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)) {
        Column(Modifier.navigationBarsPadding().imePadding().padding(top = 10.dp, bottom = 10.dp)) {
            AnimatedVisibility(hasBody && !state.generating) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(bottom = 8.dp),
                ) {
                    items(RewriteAction.entries) { a -> AiActionChip(a.label) { onRewrite(a) } }
                }
            }
            Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surfaceContainer, modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.padding(start = 10.dp).size(28.dp).clip(CircleShape).background(AiGradient),
                            contentAlignment = Alignment.Center,
                        ) { Icon(Icons.Rounded.AutoAwesome, null, Modifier.size(16.dp), tint = Color.White) }
                        TextField(
                            value = state.aiPrompt,
                            onValueChange = onPrompt,
                            placeholder = {
                                Text(
                                    if (hasBody) "Peça uma alteração à IA…" else if (state.replyTo != null) "Como quer responder?" else "O que quer escrever?",
                                    maxLines = 1,
                                )
                            },
                            maxLines = 4,
                            modifier = Modifier.weight(1f),
                            colors = transparentFieldColors(),
                        )
                        IconButton(onClick = onVoiceInstruct) { Icon(Icons.Rounded.Mic, "Falar com a IA") }
                    }
                }
                Spacer(Modifier.width(8.dp))
                if (state.generating) {
                    FilledIconButton(onClick = onStop, colors = IconButtonDefaults.filledIconButtonColors(containerColor = MaterialTheme.colorScheme.error)) {
                        Icon(Icons.Rounded.Stop, "Parar")
                    }
                } else {
                    Box(
                        Modifier.size(48.dp).clip(CircleShape).background(AiGradient),
                        contentAlignment = Alignment.Center,
                    ) {
                        IconButton(onClick = onGenerate, enabled = state.aiPrompt.isNotBlank() || state.replyTo != null) {
                            Icon(Icons.AutoMirrored.Rounded.Send, "Gerar com IA", tint = Color.White)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun VoiceOverlay(state: ComposeUiState, onStop: () -> Unit) {
    AnimatedVisibility(
        visible = state.listening != null,
        enter = fadeIn() + slideInVertically { it / 3 },
        exit = fadeOut() + slideOutVertically { it / 3 },
    ) {
        Box(
            Modifier.fillMaxSize().background(MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f)),
            contentAlignment = Alignment.BottomCenter,
        ) {
            Surface(
                shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    Modifier.navigationBarsPadding().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    AiBadge(if (state.listening == VoiceMode.INSTRUCT) "Diga à IA o que escrever" else "A ditar")
                    Spacer(Modifier.height(16.dp))
                    Text(
                        state.partialTranscript.ifBlank {
                            if (state.listening == VoiceMode.INSTRUCT) "Ex.: “Responde a aceitar a reunião de quinta e pergunta se posso levar o Pedro”"
                            else "Comece a falar…"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        color = if (state.partialTranscript.isBlank()) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(Modifier.height(20.dp))
                    VoiceButton(listening = true, level = state.voiceLevel, size = 72.dp, onClick = onStop)
                    Spacer(Modifier.height(8.dp))
                    Text("Toque para terminar", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TemplatePickerSheet(
    templates: List<EmailTemplate>,
    onDismiss: () -> Unit,
    onUseWithAi: (EmailTemplate) -> Unit,
    onInsert: (EmailTemplate) -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Text("Os seus modelos", Modifier.padding(horizontal = 20.dp), style = MaterialTheme.typography.titleLarge)
        Text(
            "A IA preenche automaticamente as variáveis {{assim}} com o contexto do e-mail.",
            Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (templates.isEmpty()) {
            Text("Ainda não tem modelos. Guarde um e-mail como modelo no menu ⋮.", Modifier.padding(20.dp))
        }
        LazyColumn(contentPadding = PaddingValues(bottom = 32.dp)) {
            items(templates, key = { it.id }) { t ->
                Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp)) {
                    Text(t.name, style = MaterialTheme.typography.titleMedium)
                    Text(
                        t.body.replace("\n", " "), maxLines = 2, overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp)) {
                        AiActionChip("Completar com IA", Icons.Rounded.AutoAwesome) { onUseWithAi(t) }
                        OutlinedButton(onClick = { onInsert(t) }) { Text("Inserir") }
                    }
                }
                HorizontalDivider(Modifier.padding(horizontal = 20.dp))
            }
        }
    }
}
