package com.auramail.data.graph

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/** Subconjunto da API Microsoft Graph v1.0 usado pela app. */
interface GraphApi {

    @GET("me")
    suspend fun me(): GraphUser

    @GET("me/mailFolders/{folder}/messages")
    suspend fun listMessages(
        @Path("folder") folder: String,
        @Query("\$top") top: Int = 40,
        @Query("\$skip") skip: Int = 0,
        @Query("\$orderby") orderBy: String = "receivedDateTime desc",
        @Query("\$select") select: String = LIST_FIELDS,
    ): GraphList<GraphMessage>

    @GET("me/messages/{id}")
    suspend fun getMessage(
        @Path("id") id: String,
        @Query("\$select") select: String = "$LIST_FIELDS,toRecipients,ccRecipients,body,conversationId",
        @Header("Prefer") prefer: String = "outlook.body-content-type=\"text\"",
    ): GraphMessage

    /** Pesquisa KQL em todas as pastas. O Graph não permite \$orderby com \$search. */
    @GET("me/messages")
    suspend fun search(
        @Query("\$search") kql: String,
        @Query("\$top") top: Int = 30,
        @Query("\$select") select: String = LIST_FIELDS,
    ): GraphList<GraphMessage>

    @POST("me/sendMail")
    suspend fun sendMail(@Body request: SendMailRequest): Response<Unit>

    @POST("me/messages/{id}/reply")
    suspend fun reply(@Path("id") id: String, @Body request: ReplyRequest): Response<Unit>

    @POST("me/messages")
    suspend fun createDraft(@Body message: GraphOutgoingMessage): GraphMessage

    @PATCH("me/messages/{id}")
    suspend fun setRead(@Path("id") id: String, @Body patch: ReadPatch): GraphMessage

    @POST("me/messages/{id}/move")
    suspend fun move(@Path("id") id: String, @Body request: MoveRequest): GraphMessage

    @DELETE("me/messages/{id}")
    suspend fun delete(@Path("id") id: String): Response<Unit>

    companion object {
        const val BASE_URL = "https://graph.microsoft.com/v1.0/"
        const val LIST_FIELDS = "id,subject,bodyPreview,receivedDateTime,isRead,hasAttachments,importance,from,flag"
    }
}
