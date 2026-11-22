package com.auramail.data.mail

import com.auramail.data.model.Contact
import com.auramail.data.model.EmailDetail
import com.auramail.data.model.EmailSummary
import com.auramail.data.model.MailFolder
import com.auramail.data.model.OutgoingEmail
import com.auramail.data.model.SearchPlan
import kotlinx.coroutines.delay
import java.text.Normalizer
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

/**
 * Caixa de correio de demonstração, usada enquanto não há conta Microsoft 365 ligada.
 * Permite experimentar todas as funcionalidades de IA sem configuração.
 */
class DemoMailRepository : MailRepository {

    private data class Stored(val detail: EmailDetail, var folder: MailFolder)

    private val store = mutableListOf<Stored>().apply { addAll(seed()) }

    override suspend fun list(folder: MailFolder, skip: Int): List<EmailSummary> {
        delay(250)
        return store.filter { it.folder == folder }.map { it.detail.summary }
            .sortedByDescending { it.receivedAt }.drop(skip)
    }

    override suspend fun get(id: String): EmailDetail =
        store.first { it.detail.summary.id == id }.detail

    override suspend fun search(plan: SearchPlan, rawQuery: String): List<EmailSummary> {
        delay(200)
        val zone = ZoneId.systemDefault()
        val terms = plan.keywords.ifEmpty {
            if (plan.from == null && plan.subjectContains == null && plan.hasAttachments == null &&
                plan.after == null && plan.before == null && !plan.unreadOnly
            ) rawQuery.split(" ").filter { it.length > 2 } else emptyList()
        }.map { it.norm() }

        return store.asSequence().filter { it.folder != MailFolder.DRAFTS }.map { it.detail }.filter { d ->
            val s = d.summary
            val date = s.receivedAt.atZone(zone).toLocalDate()
            val hay = "${s.subject} ${d.body} ${s.from.name} ${s.from.address}".norm()
            (plan.from == null || "${s.from.name} ${s.from.address}".norm().contains(plan.from.norm())) &&
                (plan.to == null || d.to.any { "${it.name} ${it.address}".norm().contains(plan.to.norm()) }) &&
                (plan.subjectContains == null || s.subject.norm().contains(plan.subjectContains.norm())) &&
                (plan.hasAttachments != true || s.hasAttachments) &&
                (!plan.unreadOnly || !s.isRead) &&
                (plan.after == null || !date.isBefore(plan.after)) &&
                (plan.before == null || !date.isAfter(plan.before)) &&
                (terms.isEmpty() || terms.any { hay.contains(it) })
        }.map { it.summary }.sortedByDescending { it.receivedAt }.toList()
    }

    override suspend fun send(email: OutgoingEmail) {
        delay(400)
        store += Stored(
            EmailDetail(
                summary = EmailSummary(
                    id = UUID.randomUUID().toString(), from = Contact("Eu", "eu@empresa.pt"),
                    subject = email.subject, preview = email.body.take(120), receivedAt = Instant.now(),
                    isRead = true, hasAttachments = false,
                ),
                to = email.to.map { Contact("", it) }, cc = email.cc.map { Contact("", it) }, body = email.body,
            ),
            MailFolder.SENT,
        )
    }

    override suspend fun saveDraft(email: OutgoingEmail) {
        store += Stored(
            EmailDetail(
                summary = EmailSummary(
                    id = UUID.randomUUID().toString(), from = Contact("Eu", "eu@empresa.pt"),
                    subject = email.subject.ifBlank { "(sem assunto)" }, preview = email.body.take(120),
                    receivedAt = Instant.now(), isRead = true, hasAttachments = false,
                ),
                to = email.to.map { Contact("", it) }, cc = emptyList(), body = email.body,
            ),
            MailFolder.DRAFTS,
        )
    }

    override suspend fun markRead(id: String, read: Boolean) {
        val i = store.indexOfFirst { it.detail.summary.id == id }
        if (i >= 0) {
            val d = store[i].detail
            store[i] = store[i].copy(detail = d.copy(summary = d.summary.copy(isRead = read)))
        }
    }

    override suspend fun archive(id: String) {
        store.firstOrNull { it.detail.summary.id == id }?.folder = MailFolder.ARCHIVE
    }

    override suspend fun delete(id: String) {
        store.removeAll { it.detail.summary.id == id }
    }

    private fun String.norm() = Normalizer.normalize(lowercase(), Normalizer.Form.NFD)
        .replace(Regex("\\p{M}"), "")

    private fun seed(): List<Stored> {
        val now = Instant.now()
        val me = Contact("Eu", "eu@empresa.pt")
        fun mail(
            from: Contact, subject: String, body: String, hoursAgo: Long, read: Boolean = true,
            attach: Boolean = false, flagged: Boolean = false, folder: MailFolder = MailFolder.INBOX,
        ) = Stored(
            EmailDetail(
                summary = EmailSummary(
                    id = UUID.randomUUID().toString(), from = from, subject = subject,
                    preview = body.replace("\n", " ").take(140), receivedAt = now.minus(Duration.ofHours(hoursAgo)),
                    isRead = read, hasAttachments = attach, isFlagged = flagged,
                ),
                to = listOf(me), cc = emptyList(), body = body,
            ),
            folder,
        )

        val ana = Contact("Ana Ribeiro", "ana.ribeiro@clientex.pt")
        val joao = Contact("João Martins", "joao.martins@empresa.pt")
        val edp = Contact("EDP Comercial", "faturas@edp.pt")
        val rh = Contact("Recursos Humanos", "rh@empresa.pt")
        val marta = Contact("Marta Sousa", "marta.sousa@fornecedor.com")
        val tap = Contact("TAP Air Portugal", "noreply@flytap.com")
        val pedro = Contact("Pedro Alves", "pedro.alves@empresa.pt")

        return listOf(
            mail(ana, "Proposta comercial – revisão de preços",
                "Olá,\n\nAnalisámos a proposta enviada na semana passada. Achamos o âmbito adequado, mas precisamos de uma revisão do preço da fase 2 (cerca de 10%).\n\nConseguem enviar uma versão revista até sexta-feira?\n\nCumprimentos,\nAna Ribeiro\nDiretora de Compras – ClienteX", 2, read = false, attach = true, flagged = true),
            mail(joao, "Reunião de planeamento Q1 – quinta às 10h",
                "Bom dia equipa,\n\nVamos fazer a reunião de planeamento do Q1 na quinta-feira às 10h, sala Tejo (ou Teams).\n\nAgenda:\n1. Resultados Q4\n2. Objetivos Q1\n3. Recrutamento\n\nConfirmem presença, por favor.\n\nJoão", 5, read = false),
            mail(edp, "A sua fatura de outubro está disponível",
                "Caro cliente,\n\nA fatura n.º FT 2026/10-88213 no valor de 74,32 € já está disponível. Data limite de pagamento: 28 de novembro.\n\nReferência MB: 21312 / 123 456 789\n\nEDP Comercial", 30, attach = true),
            mail(rh, "Marcação de férias 2027",
                "Olá a todos,\n\nRelembramos que o mapa de férias de 2027 deve ser preenchido no portal até 15 de dezembro.\n\nObrigado,\nRecursos Humanos", 48),
            mail(marta, "Atraso na entrega da encomenda #4471",
                "Bom dia,\n\nInformamos que a encomenda #4471 terá um atraso de 5 dias úteis devido a problemas logísticos. Pedimos desculpa pelo incómodo.\n\nNova data prevista: 2 de dezembro.\n\nMarta Sousa\nApoio ao Cliente", 70, read = false),
            mail(tap, "Confirmação de reserva – Lisboa → Londres",
                "A sua reserva ABC123 está confirmada.\n\nVoo TP1350, 12 dez, partida 07:05 de Lisboa (LIS), chegada 09:50 a Londres (LHR).\n\nBoa viagem!", 120, attach = true),
            mail(pedro, "Relatório mensal – dados de vendas",
                "Olá,\n\nSegue em anexo o relatório mensal de vendas de outubro. Crescimento de 8% face a setembro, com destaque para a região Norte.\n\nAbraço,\nPedro", 200, attach = true),
            mail(ana, "Re: Kick-off do projeto",
                "Obrigada pela reunião de ontem. Ficou tudo claro. Aguardamos o cronograma detalhado.\n\nAna", 400),
            mail(me.copy(), "Envio de proposta – ClienteX",
                "Olá Ana,\n\nConforme combinado, segue em anexo a proposta comercial.\n\nCumprimentos", 180, folder = MailFolder.SENT),
        )
    }
}
