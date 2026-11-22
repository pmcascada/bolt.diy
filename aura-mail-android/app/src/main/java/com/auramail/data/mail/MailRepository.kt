package com.auramail.data.mail

import com.auramail.data.model.EmailDetail
import com.auramail.data.model.EmailSummary
import com.auramail.data.model.MailFolder
import com.auramail.data.model.OutgoingEmail
import com.auramail.data.model.SearchPlan

interface MailRepository {
    suspend fun list(folder: MailFolder, skip: Int = 0): List<EmailSummary>
    suspend fun get(id: String): EmailDetail
    suspend fun search(plan: SearchPlan, rawQuery: String): List<EmailSummary>
    suspend fun send(email: OutgoingEmail)
    suspend fun saveDraft(email: OutgoingEmail)
    suspend fun markRead(id: String, read: Boolean)
    suspend fun archive(id: String)
    suspend fun delete(id: String)
}
