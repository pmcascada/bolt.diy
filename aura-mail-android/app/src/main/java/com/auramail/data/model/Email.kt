package com.auramail.data.model

import java.time.Instant

enum class MailFolder(val graphId: String, val label: String) {
    INBOX("inbox", "Entrada"),
    SENT("sentitems", "Enviados"),
    DRAFTS("drafts", "Rascunhos"),
    ARCHIVE("archive", "Arquivo"),
}

data class Contact(val name: String, val address: String) {
    val display: String get() = name.ifBlank { address }
}

data class EmailSummary(
    val id: String,
    val from: Contact,
    val subject: String,
    val preview: String,
    val receivedAt: Instant,
    val isRead: Boolean,
    val hasAttachments: Boolean,
    val isFlagged: Boolean = false,
    val importance: String = "normal",
)

data class EmailDetail(
    val summary: EmailSummary,
    val to: List<Contact>,
    val cc: List<Contact>,
    val body: String,
    val conversationId: String? = null,
)

data class OutgoingEmail(
    val to: List<String>,
    val cc: List<String> = emptyList(),
    val subject: String,
    val body: String,
    val replyToId: String? = null,
)

/** Filtros estruturados que a IA extrai de uma pesquisa em linguagem natural. */
data class SearchPlan(
    val keywords: List<String> = emptyList(),
    val from: String? = null,
    val to: String? = null,
    val subjectContains: String? = null,
    val hasAttachments: Boolean? = null,
    val after: java.time.LocalDate? = null,
    val before: java.time.LocalDate? = null,
    val unreadOnly: Boolean = false,
    val isQuestion: Boolean = false,
    val explanation: String = "",
) {
    /** Converte o plano em KQL para o parâmetro \$search do Microsoft Graph. */
    fun toKql(): String {
        val parts = mutableListOf<String>()
        from?.let { parts += "from:${quote(it)}" }
        to?.let { parts += "to:${quote(it)}" }
        subjectContains?.let { parts += "subject:${quote(it)}" }
        if (hasAttachments == true) parts += "hasAttachments:true"
        after?.let { parts += "received>=$it" }
        before?.let { parts += "received<=$it" }
        keywords.forEach { parts += quote(it) }
        return parts.joinToString(" AND ")
    }

    /** Etiquetas legíveis mostradas como chips na interface. */
    fun chips(): List<String> = buildList {
        from?.let { add("De: $it") }
        to?.let { add("Para: $it") }
        subjectContains?.let { add("Assunto: $it") }
        if (hasAttachments == true) add("Com anexos")
        if (unreadOnly) add("Não lidos")
        after?.let { add("Desde $it") }
        before?.let { add("Até $it") }
        keywords.forEach { add("“$it”") }
    }

    private fun quote(s: String) = if (s.contains(' ')) "\"${s.replace("\"", "")}\"" else s
}
