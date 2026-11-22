package com.auramail.ui.inbox

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.data.model.MailFolder
import com.auramail.ui.components.AiBadge
import com.auramail.ui.components.AiCard
import com.auramail.ui.components.EmptyState
import com.auramail.ui.components.SwipeableEmailRow
import com.auramail.ui.components.ThinkingDots
import com.auramail.ui.theme.AiGradient
import java.time.LocalTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InboxScreen(
    vm: InboxViewModel,
    onOpenEmail: (String) -> Unit,
    onCompose: () -> Unit,
    onSearch: (voice: Boolean) -> Unit,
    onTemplates: () -> Unit,
    onSettings: () -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val isDemo by vm.isDemo.collectAsStateWithLifecycle()
    val account by vm.account.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()
    val expandedFab by remember { derivedStateOf { listState.firstVisibleItemIndex == 0 } }
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.error) {
        state.error?.let { snackbar.showSnackbar(it); vm.clearError() }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onCompose,
                expanded = expandedFab,
                icon = { Icon(Icons.Rounded.Edit, null) },
                text = { Text("Escrever") },
                containerColor = MaterialTheme.colorScheme.primaryContainer,
            )
        },
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = state.refreshing,
            onRefresh = vm::refresh,
            modifier = Modifier.fillMaxSize().padding(top = padding.calculateTopPadding()),
        ) {
            LazyColumn(state = listState, contentPadding = PaddingValues(bottom = 96.dp), modifier = Modifier.fillMaxSize()) {
                item {
                    Header(
                        name = account?.username?.substringBefore('@')?.replaceFirstChar { it.uppercase() },
                        onTemplates = onTemplates, onSettings = onSettings,
                    )
                }
                item { SearchPill(onClick = { onSearch(false) }, onVoice = { onSearch(true) }) }
                if (isDemo) item { DemoBanner(onSettings) }
                item {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 8.dp),
                    ) {
                        items(MailFolder.entries) { f ->
                            FilterChip(selected = state.folder == f, onClick = { vm.selectFolder(f) }, label = { Text(f.label) })
                        }
                    }
                }
                if (state.folder == MailFolder.INBOX && state.emails.isNotEmpty()) {
                    item { BriefingSection(state, vm::toggleBriefing) }
                }
                when {
                    state.loading -> item {
                        Box(Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                    }
                    state.emails.isEmpty() -> item {
                        EmptyState(Icons.Rounded.Inbox, "Tudo em dia", "Não há mensagens em ${state.folder.label}.")
                    }
                    else -> items(state.emails, key = { it.id }) { email ->
                        SwipeableEmailRow(
                            email = email,
                            onClick = { onOpenEmail(email.id) },
                            onArchive = { vm.archive(email) },
                            onDelete = { vm.delete(email) },
                        )
                        HorizontalDivider(Modifier.padding(start = 74.dp), color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                    }
                }
            }
        }
    }
}

@Composable
private fun Header(name: String?, onTemplates: () -> Unit, onSettings: () -> Unit) {
    val greeting = when (LocalTime.now().hour) {
        in 5..12 -> "Bom dia"
        in 13..19 -> "Boa tarde"
        else -> "Boa noite"
    }
    Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(if (name != null) "$greeting, $name" else greeting, style = MaterialTheme.typography.headlineMedium)
            Text("Aura Mail", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        IconButton(onClick = onTemplates) { Icon(Icons.Rounded.Description, "Modelos") }
        IconButton(onClick = onSettings) { Icon(Icons.Rounded.Settings, "Definições") }
    }
}

@Composable
private fun SearchPill(onClick: () -> Unit, onVoice: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(50),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Row(Modifier.padding(start = 18.dp, end = 6.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.Search, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(12.dp))
            Text(
                "Pesquise ou pergunte à sua caixa…", Modifier.weight(1f),
                color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyLarge,
            )
            Box(
                Modifier.size(40.dp).clip(RoundedCornerShape(50)).background(AiGradient).clickable(onClick = onVoice),
                contentAlignment = Alignment.Center,
            ) { Icon(Icons.Rounded.Mic, "Pesquisa por voz", tint = Color.White) }
        }
    }
}

@Composable
private fun DemoBanner(onSettings: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.tertiaryContainer,
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
    ) {
        Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Modo demonstração – ligue a sua conta Microsoft 365.", Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onTertiaryContainer,
            )
            TextButton(onClick = onSettings) { Text("Ligar") }
        }
    }
}

@Composable
private fun BriefingSection(state: InboxUiState, onToggle: () -> Unit) {
    Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AiBadge("Briefing do dia")
            Spacer(Modifier.weight(1f))
            TextButton(onClick = onToggle) {
                Icon(if (state.briefingVisible) Icons.Rounded.Close else Icons.Rounded.AutoAwesome, null, Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(if (state.briefingVisible) "Fechar" else "Resumir não lidos")
            }
        }
        AnimatedVisibility(
            visible = state.briefingVisible,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut(),
        ) {
            AiCard(Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 8.dp)) {
                if (state.briefingLoading) ThinkingDots(Modifier.padding(vertical = 8.dp))
                else Text(state.briefing, style = MaterialTheme.typography.bodyMedium)
            }
        }
        Spacer(Modifier.height(4.dp))
    }
}
