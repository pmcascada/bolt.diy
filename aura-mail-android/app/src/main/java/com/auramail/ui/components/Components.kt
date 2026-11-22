package com.auramail.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.auramail.ui.theme.AiGradient
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.abs

private val avatarPalette = listOf(
    Color(0xFF5B4BDB), Color(0xFFE0569B), Color(0xFF00897B), Color(0xFFF4511E),
    Color(0xFF3949AB), Color(0xFF8E24AA), Color(0xFF43A047), Color(0xFFFB8C00),
)

@Composable
fun Avatar(name: String, size: Dp = 44.dp) {
    val initials = name.split(" ", ".", "@").filter { it.isNotBlank() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifBlank { "?" }
    val color = avatarPalette[abs(name.hashCode()) % avatarPalette.size]
    Box(
        Modifier.size(size).clip(CircleShape).background(color),
        contentAlignment = Alignment.Center,
    ) {
        Text(initials, color = Color.White, style = MaterialTheme.typography.titleMedium)
    }
}

/** Etiqueta "IA" com o gradiente da marca. */
@Composable
fun AiBadge(text: String = "IA", modifier: Modifier = Modifier) {
    Row(
        modifier.clip(RoundedCornerShape(50)).background(AiGradient).padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Rounded.AutoAwesome, null, tint = Color.White, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(4.dp))
        Text(text, color = Color.White, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
    }
}

/** Cartão com borda em gradiente para conteúdos gerados pela IA. */
@Composable
fun AiCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Surface(
        modifier = modifier.border(1.5.dp, AiGradient, MaterialTheme.shapes.large),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surfaceContainer,
    ) {
        Column(Modifier.padding(16.dp)) { content() }
    }
}

@Composable
fun AiActionChip(label: String, icon: ImageVector? = null, enabled: Boolean = true, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(50),
        color = MaterialTheme.colorScheme.secondaryContainer,
        modifier = Modifier.graphicsLayer { alpha = if (enabled) 1f else 0.5f },
    ) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(icon, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSecondaryContainer)
                Spacer(Modifier.width(6.dp))
            }
            Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSecondaryContainer)
        }
    }
}

/**
 * Botão de microfone: pulsa enquanto ouve e reage ao volume da voz.
 */
@Composable
fun VoiceButton(listening: Boolean, level: Float, size: Dp = 56.dp, onClick: () -> Unit) {
    val pulse = rememberInfiniteTransition(label = "pulse")
    val ring by pulse.animateFloat(
        1f, 1.35f, infiniteRepeatable(tween(900), RepeatMode.Reverse), label = "ring",
    )
    val voice by animateFloatAsState(1f + (level.coerceIn(0f, 10f) / 25f), label = "voice")
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(size * 1.4f)) {
        if (listening) {
            Box(
                Modifier.size(size).scale(ring * voice).clip(CircleShape)
                    .background(MaterialTheme.colorScheme.error.copy(alpha = 0.18f)),
            )
        }
        Box(
            Modifier.size(size).clip(CircleShape)
                .background(if (listening) Color(0xFFE53935).let { androidx.compose.ui.graphics.SolidColor(it) } else AiGradient)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                if (listening) Icons.Rounded.Stop else Icons.Rounded.Mic,
                contentDescription = if (listening) "Parar" else "Falar",
                tint = Color.White,
            )
        }
    }
}

@Composable
fun EmptyState(icon: ImageVector, title: String, message: String, modifier: Modifier = Modifier) {
    Column(
        modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            Modifier.size(88.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, null, Modifier.size(40.dp), tint = MaterialTheme.colorScheme.onPrimaryContainer)
        }
        Spacer(Modifier.height(16.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Text(
            message, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/** Animação de "a pensar" com três pontos. */
@Composable
fun ThinkingDots(modifier: Modifier = Modifier) {
    val t = rememberInfiniteTransition(label = "dots")
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        repeat(3) { i ->
            val a by t.animateFloat(
                0.2f, 1f,
                infiniteRepeatable(tween(600, delayMillis = i * 150), RepeatMode.Reverse), label = "d$i",
            )
            Box(Modifier.size(8.dp).graphicsLayer { alpha = a }.clip(CircleShape).background(AiGradient))
        }
    }
}

private val ptLocale = Locale.forLanguageTag("pt-PT")

fun formatRelative(instant: Instant): String {
    val zone = ZoneId.systemDefault()
    val date = instant.atZone(zone).toLocalDate()
    val today = LocalDate.now(zone)
    return when {
        date == today -> DateTimeFormatter.ofPattern("HH:mm").format(instant.atZone(zone))
        date == today.minusDays(1) -> "Ontem"
        ChronoUnit.DAYS.between(date, today) < 7 -> DateTimeFormatter.ofPattern("EEE", ptLocale).format(date)
        date.year == today.year -> DateTimeFormatter.ofPattern("d MMM", ptLocale).format(date)
        else -> DateTimeFormatter.ofPattern("d MMM yyyy", ptLocale).format(date)
    }
}

fun formatFull(instant: Instant): String =
    DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'às' HH:mm", ptLocale).format(instant.atZone(ZoneId.systemDefault()))
