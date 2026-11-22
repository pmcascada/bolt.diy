package com.auramail.ai

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.core.JsonValue
import com.anthropic.errors.AnthropicServiceException
import com.anthropic.errors.RateLimitException
import com.anthropic.errors.UnauthorizedException
import com.anthropic.models.messages.Message
import com.anthropic.models.messages.MessageCreateParams
import com.anthropic.models.messages.OutputConfig
import com.auramail.data.model.EmailDetail
import com.auramail.data.model.SearchPlan
import com.auramail.data.settings.AiModel
import com.auramail.data.settings.UserSettings
import com.auramail.data.templates.EmailTemplate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class AiException(message: String) : Exception(message)

enum class RewriteAction(val label: String, val instruction: String) {
    IMPROVE("Melhorar", "Melhora a clareza, fluidez e impacto do texto, mantendo o sentido e o tom."),
    SHORTEN("Encurtar", "Torna o texto mais curto e direto (cerca de metade), sem perder informação essencial."),
    EXPAND("Desenvolver", "Desenvolve o texto com mais detalhe e contexto, mantendo-o profissional."),
    FORMAL("Mais formal", "Reescreve num tom formal e profissional."),
    FRIENDLY("Mais próximo", "Reescreve num tom cordial, caloroso e próximo, mas profissional."),
    FIX("Corrigir", "Corrige apenas ortografia, gramática e pontuação. Não alteres o estilo."),
    BULLETS("Em tópicos", "Reorganiza o conteúdo principal em tópicos claros, com uma frase de abertura e de fecho."),
    TO_EN("Inglês", "Traduz para inglês profissional e natural."),
    TO_PT("Português", "Traduz para português europeu (pt-PT) natural."),
}

data class ComposeRequest(
    val instruction: String,
    val currentSubject: String = "",
    val currentBody: String = "",
    val replyTo: EmailDetail? = null,
    val templates: List<EmailTemplate> = emptyList(),
    val forcedTemplate: EmailTemplate? = null,
    val tone: String? = null,
)

/**
 * Toda a inteligência da app, sobre a API do Claude (SDK oficial Java).
 *
 * NOTA DE PRODUÇÃO: aqui a chave é introduzida pelo próprio utilizador e guardada cifrada no
 * dispositivo. Para distribuição pública, coloque um pequeno backend/proxy entre a app e a API
 * para não expor chaves e para controlar custos por utilizador.
 */
class AiAssistant(
    private val apiKeyProvider: () -> String,
    private val settingsProvider: () -> UserSettings,
) {
    private var cachedKey: String? = null
    private var cachedClient: AnthropicClient? = null
    private val json = Json { ignoreUnknownKeys = true; isLenient = true; coerceInputValues = true }

    val isConfigured: Boolean get() = apiKeyProvider().isNotBlank()

    private fun client(): AnthropicClient {
        val key = apiKeyProvider()
        if (key.isBlank()) throw AiException("Adicione a sua chave da API Claude nas Definições para usar a IA.")
        if (key != cachedKey || cachedClient == null) {
            cachedClient = AnthropicOkHttpClient.builder().apiKey(key).build()
            cachedKey = key
        }
        return cachedClient!!
    }

    private fun params(
        system: String,
        user: String,
        effort: OutputConfig.Effort,
        maxTokens: Long = 16000L,
    ): MessageCreateParams {
        val model = settingsProvider().model
        val b = MessageCreateParams.builder()
            .model(model.id)
            .maxTokens(maxTokens)
            .system(system)
            .outputConfig(OutputConfig.builder().effort(effort).build())
            .addUserMessage(user)
        // Se um pedido for recusado pelos classificadores de segurança, a API repete-o
        // automaticamente noutro modelo (server-side fallbacks). Não disponível no Haiku.
        if (model != AiModel.HAIKU) {
            b.putAdditionalHeader("anthropic-beta", "server-side-fallback-2026-07-01")
            b.putAdditionalBodyProperty("fallbacks", JsonValue.from("default"))
        }
        return b.build()
    }

    private suspend fun complete(system: String, user: String, effort: OutputConfig.Effort, maxTokens: Long = 16000L): String =
        withContext(Dispatchers.IO) {
            val msg: Message = guard { client().messages().create(params(system, user, effort, maxTokens)) }
            if (msg.stopReason().orElse(null)?.toString() == "refusal") {
                throw AiException("A IA não conseguiu responder a este pedido. Tente reformular.")
            }
            msg.content().mapNotNull { it.text().orElse(null)?.text() }.joinToString("").trim()
        }

    private fun stream(system: String, user: String, effort: OutputConfig.Effort): Flow<String> = flow {
        val response = guard { client().messages().createStreaming(params(system, user, effort, 32000L)) }
        response.use { sr ->
            val it = sr.stream().iterator()
            while (it.hasNext()) {
                val event = it.next()
                event.contentBlockDelta().orElse(null)?.delta()?.text()?.orElse(null)?.let { emit(it.text()) }
                val stop = event.messageDelta().orElse(null)?.delta()?.stopReason()?.orElse(null)
                if (stop?.toString() == "refusal") {
                    throw AiException("A IA interrompeu a resposta. Tente reformular o pedido.")
                }
            }
        }
    }.flowOn(Dispatchers.IO)

    private inline fun <T> guard(block: () -> T): T = try {
        block()
    } catch (e: UnauthorizedException) {
        throw AiException("Chave da API inválida. Verifique-a nas Definições.")
    } catch (e: RateLimitException) {
        throw AiException("Limite de pedidos atingido. Tente novamente dentro de instantes.")
    } catch (e: AnthropicServiceException) {
        throw AiException("Erro do serviço de IA (${e.statusCode()}). Tente novamente.")
    }

    // ---------------------------------------------------------------- Redação

    private fun baseSystem(): String {
        val s = settingsProvider()
        return buildString {
            appendLine("És o assistente de escrita do Aura Mail, um cliente de e-mail profissional.")
            appendLine("Escreves e-mails claros, naturais e bem estruturados. Por omissão escreves em português europeu (pt-PT), a menos que o utilizador peça outra língua ou esteja a responder a um e-mail noutra língua — nesse caso responde na língua desse e-mail.")
            appendLine("Nunca inventes factos, valores, datas ou compromissos que não estejam no pedido, no contexto ou nos modelos; quando faltar informação essencial usa um marcador entre parênteses retos, por exemplo [data], para o utilizador completar.")
            if (s.writingStyle.isNotBlank()) appendLine("Estilo pessoal do utilizador a respeitar: ${s.writingStyle}")
            if (s.signature.isNotBlank()) appendLine("Termina com esta assinatura, exatamente assim:\n${s.signature}")
        }
    }

    /** Escreve ou reescreve um rascunho completo. Primeira linha: "Assunto: ...". */
    fun compose(req: ComposeRequest): Flow<String> {
        val system = baseSystem() + """
            
            Formato da resposta (obrigatório): a primeira linha é "Assunto: <assunto>", depois uma linha em branco, depois apenas o corpo do e-mail em texto simples. Sem comentários adicionais, sem Markdown.
            
            O utilizador tem uma biblioteca de modelos de e-mail. Quando um modelo for adequado ao pedido, segue a sua estrutura, frases e tom, preenchendo as variáveis {{assim}} com a informação disponível. Se nenhum modelo for adequado, ignora-os.
        """.trimIndent()

        val user = buildString {
            req.forcedTemplate?.let {
                appendLine("<modelo_obrigatorio nome=\"${it.name}\">\nAssunto: ${it.subject}\n${it.body}\n</modelo_obrigatorio>")
                appendLine("Usa obrigatoriamente este modelo como base.\n")
            }
            if (req.forcedTemplate == null && req.templates.isNotEmpty()) {
                appendLine("<modelos_disponiveis>")
                req.templates.forEach { appendLine("<modelo nome=\"${it.name}\" categoria=\"${it.category}\">\nAssunto: ${it.subject}\n${it.body}\n</modelo>") }
                appendLine("</modelos_disponiveis>\n")
            }
            req.replyTo?.let { e ->
                appendLine("<email_a_responder>")
                appendLine("De: ${e.summary.from.name} <${e.summary.from.address}>")
                appendLine("Assunto: ${e.summary.subject}")
                appendLine(e.body.take(8000))
                appendLine("</email_a_responder>\n")
            }
            if (req.currentBody.isNotBlank() || req.currentSubject.isNotBlank()) {
                appendLine("<rascunho_atual>\nAssunto: ${req.currentSubject}\n${req.currentBody}\n</rascunho_atual>\n")
            }
            req.tone?.let { appendLine("Tom pretendido: $it\n") }
            appendLine("Pedido do utilizador: ${req.instruction.ifBlank { "Escreve o e-mail adequado." }}")
        }
        return stream(system, user, OutputConfig.Effort.MEDIUM)
    }

    /** Reescreve apenas o corpo do e-mail com uma ação rápida. */
    fun rewrite(body: String, action: RewriteAction): Flow<String> {
        val system = baseSystem() + "\nDevolve apenas o texto reescrito, sem comentários, aspas ou Markdown. Mantém a assinatura se existir."
        return stream(system, "${action.instruction}\n\n<texto>\n$body\n</texto>", OutputConfig.Effort.LOW)
    }

    /** Converte um ditado por voz (com hesitações, repetições) num texto limpo. */
    suspend fun cleanDictation(transcript: String): String = complete(
        "Recebes uma transcrição de voz em bruto para um e-mail. Remove hesitações, repetições e marcas da oralidade, corrige pontuação e gramática, mantendo as palavras e o sentido do utilizador. Devolve só o texto final.",
        transcript, OutputConfig.Effort.LOW, 4000L,
    )

    // ---------------------------------------------------------------- Pesquisa

    @Serializable
    private data class PlanDto(
        val keywords: List<String> = emptyList(),
        val from: String? = null,
        val to: String? = null,
        val subject: String? = null,
        val hasAttachments: Boolean? = null,
        val after: String? = null,
        val before: String? = null,
        val unreadOnly: Boolean = false,
        val isQuestion: Boolean = false,
        val explanation: String = "",
    )

    /** Interpreta uma pesquisa em linguagem natural ("faturas da EDP do mês passado"). */
    suspend fun planSearch(query: String, today: LocalDate = LocalDate.now()): SearchPlan {
        val system = """
            Convertes pesquisas de e-mail em linguagem natural (normalmente em português) em filtros estruturados.
            Hoje é ${today.format(DateTimeFormatter.ISO_DATE)} (${today.dayOfWeek}).
            Responde APENAS com um objeto JSON com estes campos:
            {"keywords": [palavras ou expressões a procurar no conteúdo, no máximo 4, incluindo sinónimos úteis se a pesquisa for vaga],
             "from": remetente (nome, empresa ou email) ou null,
             "to": destinatário ou null,
             "subject": texto do assunto ou null,
             "hasAttachments": true/null,
             "after": data AAAA-MM-DD ou null, "before": data AAAA-MM-DD ou null,
             "unreadOnly": boolean,
             "isQuestion": true se o utilizador faz uma pergunta cuja resposta está no conteúdo dos e-mails (ex.: "quando é o voo para Londres?"),
             "explanation": frase curta em português a explicar o que vais procurar}
            Resolve datas relativas ("ontem", "mês passado", "esta semana") para datas absolutas. Não metas na keywords palavras já usadas em from/subject nem palavras vazias.
        """.trimIndent()
        val raw = complete(system, query, OutputConfig.Effort.LOW, 2000L)
        val dto = runCatching { json.decodeFromString<PlanDto>(extractJson(raw)) }.getOrElse { PlanDto(keywords = listOf(query)) }
        return SearchPlan(
            keywords = dto.keywords.filter { it.isNotBlank() },
            from = dto.from?.takeIf { it.isNotBlank() },
            to = dto.to?.takeIf { it.isNotBlank() },
            subjectContains = dto.subject?.takeIf { it.isNotBlank() },
            hasAttachments = dto.hasAttachments,
            after = dto.after?.let { runCatching { LocalDate.parse(it) }.getOrNull() },
            before = dto.before?.let { runCatching { LocalDate.parse(it) }.getOrNull() },
            unreadOnly = dto.unreadOnly,
            isQuestion = dto.isQuestion,
            explanation = dto.explanation,
        )
    }

    /** Responde a uma pergunta com base nos e-mails encontrados ("Pergunte à sua caixa"). */
    fun answerFromEmails(question: String, emails: List<EmailDetail>): Flow<String> {
        val system = "Respondes a perguntas do utilizador sobre a sua caixa de correio, usando APENAS os e-mails fornecidos. Responde em português europeu, de forma curta e direta (1–4 frases). Indica de que e-mail vem a informação (remetente e assunto). Se a resposta não estiver nos e-mails, diz isso claramente."
        val user = buildString {
            emails.take(8).forEachIndexed { i, e ->
                appendLine("<email n=\"${i + 1}\" de=\"${e.summary.from.display}\" data=\"${e.summary.receivedAt}\" assunto=\"${e.summary.subject}\">")
                appendLine(e.body.take(3000))
                appendLine("</email>")
            }
            appendLine("\nPergunta: $question")
        }
        return stream(system, user, OutputConfig.Effort.LOW)
    }

    // ---------------------------------------------------------------- Leitura

    @Serializable
    data class EmailInsights(
        val summary: String = "",
        val actionItems: List<String> = emptyList(),
        val replies: List<String> = emptyList(),
    )

    /** Resumo, tarefas e 3 respostas rápidas para um e-mail recebido. */
    suspend fun insights(email: EmailDetail): EmailInsights {
        val system = """
            Analisas e-mails recebidos. Responde APENAS com JSON:
            {"summary": resumo em 1–2 frases em português europeu,
             "actionItems": lista (0–3) de ações concretas que o utilizador tem de fazer, com prazos se existirem,
             "replies": 3 intenções de resposta curtas e distintas (máx. 6 palavras cada), por ex. "Aceitar e confirmar presença"}
        """.trimIndent()
        val user = "De: ${email.summary.from.display}\nAssunto: ${email.summary.subject}\n\n${email.body.take(10000)}"
        val raw = complete(system, user, OutputConfig.Effort.LOW, 3000L)
        return runCatching { json.decodeFromString<EmailInsights>(extractJson(raw)) }
            .getOrElse { EmailInsights(summary = raw.take(300)) }
    }

    /** Sugere um modelo novo a partir de um e-mail escrito (para guardar na memória). */
    suspend fun templatize(subject: String, body: String): EmailTemplate {
        val system = "Transformas um e-mail concreto num modelo reutilizável: substitui nomes, datas, valores e detalhes específicos por variáveis {{nome_da_variavel}} em minúsculas. Responde APENAS com JSON: {\"name\", \"category\", \"tags\" (palavras-chave separadas por espaço), \"subject\", \"body\"}."
        val raw = complete(system, "Assunto: $subject\n\n$body", OutputConfig.Effort.LOW, 4000L)
        val t = runCatching { json.decodeFromString<TemplateDto>(extractJson(raw)) }.getOrElse { TemplateDto(subject = subject, body = body) }
        return EmailTemplate(name = t.name, category = t.category, tags = t.tags, subject = t.subject, body = t.body.ifBlank { body })
    }

    /** Cria um modelo novo a partir de uma descrição ("pedido de reembolso a um fornecedor"). */
    suspend fun createTemplate(description: String): EmailTemplate {
        val system = baseSystem() + "\nCrias modelos de e-mail reutilizáveis. Usa variáveis {{nome_da_variavel}} em minúsculas para tudo o que muda de e-mail para e-mail (nomes, datas, valores, referências). Responde APENAS com JSON: {\"name\", \"category\", \"tags\" (palavras-chave separadas por espaço), \"subject\", \"body\"}."
        val raw = complete(system, description, OutputConfig.Effort.MEDIUM, 4000L)
        val t = json.decodeFromString<TemplateDto>(extractJson(raw))
        return EmailTemplate(name = t.name, category = t.category, tags = t.tags, subject = t.subject, body = t.body)
    }

    @Serializable
    private data class TemplateDto(
        val name: String = "Novo modelo",
        val category: String = "Geral",
        val tags: String = "",
        val subject: String = "",
        val body: String = "",
    )

    private fun extractJson(raw: String): String {
        val start = raw.indexOf('{')
        val end = raw.lastIndexOf('}')
        return if (start >= 0 && end > start) raw.substring(start, end + 1) else raw
    }

    companion object {
        /** Separa "Assunto: ..." do corpo, mesmo durante o streaming. */
        fun splitDraft(text: String): Pair<String?, String> {
            val trimmed = text.trimStart()
            val prefix = Regex("^(Assunto|Subject)\\s*:\\s*", RegexOption.IGNORE_CASE)
            val m = prefix.find(trimmed) ?: return null to trimmed
            val nl = trimmed.indexOf('\n')
            return if (nl < 0) trimmed.substring(m.range.last + 1).trim() to ""
            else trimmed.substring(m.range.last + 1, nl).trim() to trimmed.substring(nl + 1).trimStart('\n', '\r')
        }
    }
}
