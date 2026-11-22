package com.auramail.data.templates

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow
import java.text.Normalizer

@Entity(tableName = "templates")
data class EmailTemplate(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val category: String = "Geral",
    val subject: String = "",
    val body: String,
    /** Palavras-chave que ajudam a IA a escolher o modelo certo. */
    val tags: String = "",
    val pinned: Boolean = false,
    val usageCount: Int = 0,
    val updatedAt: Long = System.currentTimeMillis(),
) {
    /** Variáveis no formato {{nome}} presentes no modelo. */
    val variables: List<String>
        get() = VAR_REGEX.findAll("$subject $body").map { it.groupValues[1].trim() }.distinct().toList()

    companion object {
        val VAR_REGEX = Regex("\\{\\{\\s*([^}]+?)\\s*\\}\\}")
    }
}

@Dao
interface TemplateDao {
    @Query("SELECT * FROM templates ORDER BY pinned DESC, usageCount DESC, updatedAt DESC")
    fun observeAll(): Flow<List<EmailTemplate>>

    @Query("SELECT * FROM templates")
    suspend fun all(): List<EmailTemplate>

    @Query("SELECT * FROM templates WHERE id = :id")
    suspend fun byId(id: Long): EmailTemplate?

    @Upsert
    suspend fun upsert(template: EmailTemplate): Long

    @Delete
    suspend fun delete(template: EmailTemplate)

    @Query("UPDATE templates SET usageCount = usageCount + 1 WHERE id = :id")
    suspend fun incrementUsage(id: Long)

    @Query("SELECT COUNT(*) FROM templates")
    suspend fun count(): Int
}

@Database(entities = [EmailTemplate::class], version = 1, exportSchema = true)
abstract class AuraDatabase : RoomDatabase() {
    abstract fun templates(): TemplateDao

    companion object {
        fun create(context: Context) =
            Room.databaseBuilder(context, AuraDatabase::class.java, "aura.db").build()
    }
}

/**
 * Memória de modelos de e-mail. Para além do CRUD, faz uma recuperação por relevância
 * (sobreposição de palavras) para dar à IA os modelos mais úteis para cada rascunho.
 */
class TemplateRepository(private val dao: TemplateDao) {

    val templates: Flow<List<EmailTemplate>> = dao.observeAll()

    suspend fun get(id: Long) = dao.byId(id)
    suspend fun save(t: EmailTemplate) = dao.upsert(t.copy(updatedAt = System.currentTimeMillis()))
    suspend fun delete(t: EmailTemplate) = dao.delete(t)
    suspend fun markUsed(id: Long) = dao.incrementUsage(id)

    suspend fun relevantFor(text: String, limit: Int = 3): List<EmailTemplate> {
        val query = tokens(text)
        val all = dao.all()
        if (query.isEmpty()) return all.filter { it.pinned }.take(limit)
        return all.map { t ->
            val tt = tokens("${t.name} ${t.category} ${t.tags} ${t.subject} ${t.body}")
            val tagHits = tokens(t.tags + " " + t.name).count { it in query } * 3
            t to (query.count { it in tt } + tagHits + if (t.pinned) 1 else 0)
        }.filter { it.second > 0 }.sortedByDescending { it.second }.take(limit).map { it.first }
    }

    suspend fun seedIfEmpty() {
        if (dao.count() > 0) return
        listOf(
            EmailTemplate(
                name = "Resposta a pedido de orçamento", category = "Vendas",
                tags = "orçamento proposta preço cotação cliente",
                subject = "Proposta – {{projeto}}",
                body = "Olá {{nome}},\n\nObrigado pelo seu contacto e pelo interesse nos nossos serviços.\n\nEm anexo envio a proposta para {{projeto}}, com um investimento total de {{valor}}. A proposta é válida por 30 dias.\n\nFico disponível para uma breve chamada para esclarecer qualquer dúvida.\n\nCom os melhores cumprimentos,\n{{assinatura}}",
                pinned = true,
            ),
            EmailTemplate(
                name = "Confirmar reunião", category = "Agenda",
                tags = "reunião meeting confirmar presença agenda",
                subject = "Confirmação: {{assunto}} – {{data}}",
                body = "Olá {{nome}},\n\nConfirmo a minha presença na reunião sobre {{assunto}}, no dia {{data}}.\n\nAté lá,\n{{assinatura}}",
            ),
            EmailTemplate(
                name = "Follow-up sem resposta", category = "Vendas",
                tags = "follow-up seguimento lembrete resposta",
                subject = "Seguimento: {{assunto}}",
                body = "Olá {{nome}},\n\nEspero que esteja bem. Escrevo apenas para dar seguimento ao meu e-mail anterior sobre {{assunto}}.\n\nTem alguma novidade ou dúvida em que possa ajudar?\n\nObrigado,\n{{assinatura}}",
            ),
            EmailTemplate(
                name = "Ausência / férias", category = "Pessoal",
                tags = "férias ausência fora escritório",
                subject = "Ausente até {{data_regresso}}",
                body = "Olá,\n\nEstarei ausente até {{data_regresso}}, com acesso limitado ao e-mail. Para assuntos urgentes, contacte {{contacto_alternativo}}.\n\nObrigado,\n{{assinatura}}",
            ),
        ).forEach { dao.upsert(it) }
    }

    private fun tokens(s: String): Set<String> =
        Normalizer.normalize(s.lowercase(), Normalizer.Form.NFD).replace(Regex("\\p{M}"), "")
            .split(Regex("[^a-z0-9]+")).filter { it.length > 3 && it !in STOP }.toSet()

    private companion object {
        val STOP = setOf("para", "como", "mais", "pelo", "pela", "este", "esta", "isso", "qualquer", "obrigado", "assinatura", "nome")
    }
}
