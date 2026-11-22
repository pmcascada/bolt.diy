package com.auramail.ui.templates

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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.PushPin
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.data.templates.EmailTemplate
import com.auramail.di.AppContainer
import com.auramail.ui.components.AiActionChip
import com.auramail.ui.components.AiBadge
import com.auramail.ui.components.AiCard
import com.auramail.ui.components.EmptyState
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun TemplatesScreen(
    container: AppContainer,
    onBack: () -> Unit,
    onEdit: (Long?) -> Unit,
    onUse: (Long) -> Unit,
) {
    val templates by container.templates.templates.collectAsStateWithLifecycle(emptyList())
    var category by rememberSaveable { mutableStateOf<String?>(null) }
    val categories = templates.map { it.category }.distinct().sorted()
    val shown = templates.filter { category == null || it.category == category }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Modelos") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Voltar") } },
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(onClick = { onEdit(null) }, icon = { Icon(Icons.Rounded.Add, null) }, text = { Text("Novo modelo") })
        },
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp, 0.dp, 16.dp, 96.dp)) {
            item {
                AiCard(Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                    AiBadge("Memória da IA")
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "A IA consulta automaticamente estes modelos quando escreve um rascunho e escolhe os mais relevantes. Use variáveis como {{nome}} ou {{data}} — ela preenche-as por si.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            if (categories.size > 1) item {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 8.dp)) {
                    FilterChip(selected = category == null, onClick = { category = null }, label = { Text("Todos") })
                    categories.forEach { c -> FilterChip(selected = category == c, onClick = { category = c }, label = { Text(c) }) }
                }
            }
            if (shown.isEmpty()) item {
                EmptyState(Icons.Rounded.Description, "Sem modelos", "Crie um modelo ou guarde um e-mail como modelo a partir do editor.")
            }
            items(shown, key = { it.id }) { t ->
                Card(
                    onClick = { onEdit(t.id) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (t.pinned) {
                                Icon(Icons.Rounded.PushPin, "Fixado", Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                                Spacer(Modifier.width(6.dp))
                            }
                            Text(t.name, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                            Text(t.category, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            t.body.replace("\n", " "), maxLines = 3, overflow = TextOverflow.Ellipsis,
                            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                            Text(
                                "${t.variables.size} variáveis · usado ${t.usageCount}×",
                                style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.weight(1f),
                            )
                            AiActionChip("Usar", Icons.Rounded.Edit) { onUse(t.id) }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun TemplateEditorScreen(container: AppContainer, templateId: Long?, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    var loaded by remember { mutableStateOf(templateId == null) }
    var original by remember { mutableStateOf<EmailTemplate?>(null) }
    var name by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("Geral") }
    var tags by rememberSaveable { mutableStateOf("") }
    var subject by rememberSaveable { mutableStateOf("") }
    var body by rememberSaveable { mutableStateOf("") }
    var pinned by rememberSaveable { mutableStateOf(false) }
    var aiDescription by rememberSaveable { mutableStateOf("") }
    var aiBusy by remember { mutableStateOf(false) }
    var aiError by remember { mutableStateOf<String?>(null) }

    if (!loaded) {
        androidx.compose.runtime.LaunchedEffect(templateId) {
            container.templates.get(templateId!!)?.let { t ->
                original = t; name = t.name; category = t.category; tags = t.tags; subject = t.subject; body = t.body; pinned = t.pinned
            }
            loaded = true
        }
    }

    fun apply(t: EmailTemplate) { name = t.name; category = t.category; tags = t.tags; subject = t.subject; body = t.body }
    val vars = EmailTemplate.VAR_REGEX.findAll("$subject $body").map { it.groupValues[1].trim() }.distinct().toList()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (templateId == null) "Novo modelo" else "Editar modelo") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Voltar") } },
                actions = {
                    original?.let { o ->
                        IconButton(onClick = { scope.launch { container.templates.delete(o); onBack() } }) { Icon(Icons.Rounded.Delete, "Eliminar") }
                    }
                    TextButton(
                        enabled = name.isNotBlank() && body.isNotBlank(),
                        onClick = {
                            scope.launch {
                                val base = original ?: EmailTemplate(name = name, body = body)
                                container.templates.save(base.copy(name = name, category = category.ifBlank { "Geral" }, tags = tags, subject = subject, body = body, pinned = pinned))
                                onBack()
                            }
                        },
                    ) { Text("Guardar") }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(16.dp)) {
            if (templateId == null) {
                AiCard(Modifier.fillMaxWidth()) {
                    AiBadge("Criar com IA")
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = aiDescription, onValueChange = { aiDescription = it },
                        placeholder = { Text("Ex.: pedido de reembolso a um fornecedor por produto danificado") },
                        modifier = Modifier.fillMaxWidth(), minLines = 2,
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        AiActionChip("Gerar modelo", Icons.Rounded.AutoAwesome, enabled = !aiBusy && aiDescription.isNotBlank()) {
                            aiBusy = true; aiError = null
                            scope.launch {
                                runCatching { container.ai.createTemplate(aiDescription) }
                                    .onSuccess { apply(it) }.onFailure { aiError = it.message }
                                aiBusy = false
                            }
                        }
                        if (aiBusy) { Spacer(Modifier.width(12.dp)); CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp) }
                    }
                    aiError?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                }
                Spacer(Modifier.height(16.dp))
            }
            OutlinedTextField(name, { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Spacer(Modifier.height(8.dp))
            Row {
                OutlinedTextField(category, { category = it }, label = { Text("Categoria") }, modifier = Modifier.weight(1f), singleLine = true)
                Spacer(Modifier.width(8.dp))
                OutlinedTextField(tags, { tags = it }, label = { Text("Palavras-chave") }, modifier = Modifier.weight(1.4f), singleLine = true)
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(subject, { subject = it }, label = { Text("Assunto") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(body, { body = it }, label = { Text("Corpo") }, modifier = Modifier.fillMaxWidth(), minLines = 10)
            Spacer(Modifier.height(12.dp))
            if (vars.isNotEmpty()) {
                Text("Variáveis detetadas", style = MaterialTheme.typography.labelLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    vars.forEach { SuggestionChip(onClick = {}, label = { Text("{{$it}}") }) }
                }
                Spacer(Modifier.height(8.dp))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Fixar modelo", style = MaterialTheme.typography.titleMedium)
                    Text("A IA considera-o sempre como referência.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Switch(checked = pinned, onCheckedChange = { pinned = it })
            }
        }
    }
}
