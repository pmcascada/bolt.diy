package com.auramail.data.graph

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class GraphList<T>(val value: List<T> = emptyList(), @SerialName("@odata.nextLink") val nextLink: String? = null)

@Serializable
data class GraphEmailAddress(val name: String? = null, val address: String? = null)

@Serializable
data class GraphRecipient(val emailAddress: GraphEmailAddress = GraphEmailAddress())

@Serializable
data class GraphBody(val contentType: String = "text", val content: String = "")

@Serializable
data class GraphFlag(val flagStatus: String? = null)

@Serializable
data class GraphMessage(
    val id: String,
    val subject: String? = null,
    val bodyPreview: String? = null,
    val receivedDateTime: String? = null,
    val isRead: Boolean = true,
    val hasAttachments: Boolean = false,
    val importance: String? = null,
    val conversationId: String? = null,
    val from: GraphRecipient? = null,
    val toRecipients: List<GraphRecipient> = emptyList(),
    val ccRecipients: List<GraphRecipient> = emptyList(),
    val body: GraphBody? = null,
    val flag: GraphFlag? = null,
)

@Serializable
data class GraphOutgoingMessage(
    val subject: String,
    val body: GraphBody,
    val toRecipients: List<GraphRecipient>,
    val ccRecipients: List<GraphRecipient> = emptyList(),
)

@Serializable
data class SendMailRequest(val message: GraphOutgoingMessage, val saveToSentItems: Boolean = true)

@Serializable
data class ReplyRequest(val comment: String)

@Serializable
data class MoveRequest(val destinationId: String)

@Serializable
data class ReadPatch(val isRead: Boolean)

@Serializable
data class GraphUser(val displayName: String? = null, val mail: String? = null, val userPrincipalName: String? = null)
