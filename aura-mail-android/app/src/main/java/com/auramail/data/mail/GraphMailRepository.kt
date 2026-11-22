package com.auramail.data.mail

import com.auramail.data.graph.GraphApi
import com.auramail.data.graph.GraphBody
import com.auramail.data.graph.GraphEmailAddress
import com.auramail.data.graph.GraphMessage
import com.auramail.data.graph.GraphOutgoingMessage
import com.auramail.data.graph.GraphRecipient
import com.auramail.data.graph.MoveRequest
import com.auramail.data.graph.ReadPatch
import com.auramail.data.graph.ReplyRequest
import com.auramail.data.graph.SendMailRequest
import com.auramail.data.model.Contact
import com.auramail.data.model.EmailDetail
import com.auramail.data.model.EmailSummary
import com.auramail.data.model.MailFolder
import com.auramail.data.model.OutgoingEmail
import com.auramail.data.model.SearchPlan
import java.time.Instant
import java.time.ZoneId

class GraphMailRepository(private val api: GraphApi) : MailRepository {

    override suspend fun list(folder: MailFolder, skip: Int) =
        api.listMessages(folder.graphId, skip = skip).value.map { it.toSummary() }

    override suspend fun get(id: String): EmailDetail {
        val m = api.getMessage(id)
        return EmailDetail(
            summary = m.toSummary(),
            to = m.toRecipients.map { it.toContact() },
            cc = m.ccRecipients.map { it.toContact() },
            body = m.body?.content.orEmpty(),
            conversationId = m.conversationId,
        )
    }

    override suspend fun search(plan: SearchPlan, rawQuery: String): List<EmailSummary> {
        val kql = plan.toKql().ifBlank { rawQuery }
        // O \$search do Graph exige a expressão entre aspas
        var results = api.search("\"${kql.replace("\"", "'")}\"").value.map { it.toSummary() }
        if (results.isEmpty() && kql != rawQuery) {
            results = api.search("\"${rawQuery.replace("\"", "")}\"").value.map { it.toSummary() }
        }
        val zone = ZoneId.systemDefault()
        return results
            .filter { !plan.unreadOnly || !it.isRead }
            .filter { s -> plan.after?.let { !s.receivedAt.atZone(zone).toLocalDate().isBefore(it) } ?: true }
            .sortedByDescending { it.receivedAt }
    }

    override suspend fun send(email: OutgoingEmail) {
        val replyTo = email.replyToId
        val resp = if (replyTo != null && email.to.isEmpty()) {
            api.reply(replyTo, ReplyRequest(email.body))
        } else {
            api.sendMail(SendMailRequest(email.toGraph()))
        }
        check(resp.isSuccessful) { "Falha ao enviar (${resp.code()})" }
    }

    override suspend fun saveDraft(email: OutgoingEmail) {
        api.createDraft(email.toGraph())
    }

    override suspend fun markRead(id: String, read: Boolean) {
        api.setRead(id, ReadPatch(read))
    }

    override suspend fun archive(id: String) {
        api.move(id, MoveRequest("archive"))
    }

    override suspend fun delete(id: String) {
        api.delete(id)
    }

    private fun OutgoingEmail.toGraph() = GraphOutgoingMessage(
        subject = subject,
        body = GraphBody("text", body),
        toRecipients = to.map { GraphRecipient(GraphEmailAddress(address = it.trim())) },
        ccRecipients = cc.map { GraphRecipient(GraphEmailAddress(address = it.trim())) },
    )

    private fun GraphRecipient.toContact() = Contact(emailAddress.name.orEmpty(), emailAddress.address.orEmpty())

    private fun GraphMessage.toSummary() = EmailSummary(
        id = id,
        from = from?.toContact() ?: Contact("", ""),
        subject = subject.orEmpty().ifBlank { "(sem assunto)" },
        preview = bodyPreview.orEmpty(),
        receivedAt = receivedDateTime?.let { runCatching { Instant.parse(it) }.getOrNull() } ?: Instant.now(),
        isRead = isRead,
        hasAttachments = hasAttachments,
        isFlagged = flag?.flagStatus == "flagged",
        importance = importance ?: "normal",
    )
}
