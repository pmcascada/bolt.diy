package com.auramail.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Archive
import androidx.compose.material.icons.rounded.AttachFile
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Flag
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.auramail.data.model.EmailSummary

@Composable
fun EmailRow(email: EmailSummary, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val unread = !email.isRead
    Row(
        modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Avatar(email.from.display)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    email.from.display, Modifier.weight(1f),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (unread) FontWeight.Bold else FontWeight.Normal,
                    maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
                Text(
                    formatRelative(email.receivedAt), style = MaterialTheme.typography.labelMedium,
                    color = if (unread) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = if (unread) FontWeight.Bold else FontWeight.Normal,
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    email.subject, Modifier.weight(1f, fill = false),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (unread) FontWeight.SemiBold else FontWeight.Normal,
                    maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
                if (email.hasAttachments) Icon(Icons.Rounded.AttachFile, "Anexo", Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                if (email.isFlagged) Icon(Icons.Rounded.Flag, "Sinalizado", Modifier.size(16.dp), tint = MaterialTheme.colorScheme.error)
            }
            Text(
                email.preview, style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis,
            )
        }
        if (unread) {
            Spacer(Modifier.width(8.dp))
            Box(Modifier.padding(top = 6.dp).size(9.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
        }
    }
}

/** Deslizar para a direita arquiva, para a esquerda elimina. */
@Composable
fun SwipeableEmailRow(email: EmailSummary, onClick: () -> Unit, onArchive: () -> Unit, onDelete: () -> Unit) {
    val state = rememberSwipeToDismissBoxState(confirmValueChange = {
        when (it) {
            SwipeToDismissBoxValue.StartToEnd -> { onArchive(); true }
            SwipeToDismissBoxValue.EndToStart -> { onDelete(); true }
            SwipeToDismissBoxValue.Settled -> false
        }
    })
    SwipeToDismissBox(
        state = state,
        backgroundContent = {
            val dir = state.dismissDirection
            val color by animateColorAsState(
                when (dir) {
                    SwipeToDismissBoxValue.StartToEnd -> Color(0xFF2E7D32)
                    SwipeToDismissBoxValue.EndToStart -> Color(0xFFC62828)
                    else -> Color.Transparent
                }, label = "swipe",
            )
            Box(
                Modifier.fillMaxSize().background(color).padding(horizontal = 24.dp),
                contentAlignment = if (dir == SwipeToDismissBoxValue.StartToEnd) Alignment.CenterStart else Alignment.CenterEnd,
            ) {
                if (dir != SwipeToDismissBoxValue.Settled) {
                    Icon(
                        if (dir == SwipeToDismissBoxValue.StartToEnd) Icons.Rounded.Archive else Icons.Rounded.Delete,
                        null, tint = Color.White,
                    )
                }
            }
        },
    ) {
        Box(Modifier.background(MaterialTheme.colorScheme.surface)) { EmailRow(email, onClick) }
    }
}
