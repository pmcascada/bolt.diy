package com.auramail.ui.reader

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Reply
import androidx.compose.material.icons.rounded.Archive
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CheckCircleOutline
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.ui.components.AiActionChip
import com.auramail.ui.components.AiBadge
import com.auramail.ui.components.AiCard
import com.auramail.ui.components.Avatar
import com.auramail.ui.components.ThinkingDots
import com.auramail.ui.components.formatFull

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ReaderScreen(
    vm: ReaderViewModel,
    onBack: () -> Unit,
    onReply: (instruction: String?, voice: Boolean) -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(state.done) { if (state.done) onBack() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Voltar") } },
                actions = {
                    IconButton(onClick = vm::archive) { Icon(Icons.Rounded.Archive, "Arquivar") }
                    IconButton(onClick = vm::delete) { Icon(Icons.Rounded.Delete, "Eliminar") }
                },
            )
        },
        bottomBar = {
            if (state.email != null) {
                Surface(tonalElevation = 3.dp) {
                    Row(
                        Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Button(onClick = { onReply(null, false) }, modifier = Modifier.weight(1f)) {
                            Icon(Icons.AutoMirrored.Rounded.Reply, null); Spacer(Modifier.width(8.dp)); Text("Responder")
                        }
                        OutlinedButton(onClick = { onReply(null, true) }, modifier = Modifier.weight(1f)) {
                            Icon(Icons.Rounded.Mic, null); Spacer(Modifier.width(8.dp)); Text("Responder por voz")
                        }
                    }
                }
            }
        },
    ) { padding ->
        val email = state.email
        if (email == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                if (state.error != null) Text(state.error!!) else CircularProgressIndicator()
            }
            return@Scaffold
        }
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp),
        ) {
            Text(email.summary.subject, style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(email.summary.from.display)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(email.summary.from.display, style = MaterialTheme.typography.titleMedium)
                    Text(
                        "${email.summary.from.address} · ${formatFull(email.summary.receivedAt)}",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (email.to.isNotEmpty()) {
                        Text(
                            "Para: " + email.to.joinToString { it.display },
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            Spacer(Modifier.height(16.dp))

            InsightsCard(state, onReply, vm::retryInsights)

            Spacer(Modifier.height(16.dp))
            HorizontalDivider()
            Spacer(Modifier.height(16.dp))
            SelectionContainer { Text(email.body, style = MaterialTheme.typography.bodyLarge) }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun InsightsCard(state: ReaderUiState, onReply: (String?, Boolean) -> Unit, onRetry: () -> Unit) {
    AiCard(Modifier.fillMaxWidth()) {
        AiBadge("Resumo inteligente")
        Spacer(Modifier.height(10.dp))
        AnimatedContent(targetState = Triple(state.insightsLoading, state.insights, state.insightsError), label = "insights") { (loading, insights, error) ->
            when {
                loading -> ThinkingDots(Modifier.padding(vertical = 8.dp))
                error != null -> Column {
                    Text(error, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    TextButton(onClick = onRetry) { Text("Tentar novamente") }
                }
                insights != null -> Column {
                    Text(insights.summary, style = MaterialTheme.typography.bodyMedium)
                    if (insights.actionItems.isNotEmpty()) {
                        Spacer(Modifier.height(10.dp))
                        insights.actionItems.forEach { item ->
                            Row(Modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.Top) {
                                Icon(Icons.Rounded.CheckCircleOutline, null, Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                                Spacer(Modifier.width(8.dp))
                                Text(item, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                    if (insights.replies.isNotEmpty()) {
                        Spacer(Modifier.height(12.dp))
                        Text("Responder com IA", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(6.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            insights.replies.forEach { r -> AiActionChip(r, Icons.Rounded.AutoAwesome) { onReply(r, false) } }
                        }
                    }
                }
                else -> Spacer(Modifier.height(0.dp))
            }
        }
    }
}
