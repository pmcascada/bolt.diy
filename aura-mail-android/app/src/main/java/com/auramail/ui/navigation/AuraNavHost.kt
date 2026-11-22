package com.auramail.ui.navigation

import android.net.Uri
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.auramail.di.AppContainer
import com.auramail.ui.components.viewModelFactory
import com.auramail.ui.compose.ComposeScreen
import com.auramail.ui.compose.ComposeViewModel
import com.auramail.ui.inbox.InboxScreen
import com.auramail.ui.inbox.InboxViewModel
import com.auramail.ui.reader.ReaderScreen
import com.auramail.ui.reader.ReaderViewModel
import com.auramail.ui.search.SearchScreen
import com.auramail.ui.search.SearchViewModel
import com.auramail.ui.settings.SettingsScreen
import com.auramail.ui.templates.TemplateEditorScreen
import com.auramail.ui.templates.TemplatesScreen

private object Routes {
    const val INBOX = "inbox"
    const val SEARCH = "search?voice={voice}"
    const val READER = "email/{id}"
    const val COMPOSE = "compose?replyTo={replyTo}&instruction={instruction}&to={to}&templateId={templateId}&voice={voice}"
    const val TEMPLATES = "templates"
    const val TEMPLATE_EDIT = "template?id={id}"
    const val SETTINGS = "settings"

    fun compose(replyTo: String? = null, instruction: String? = null, to: String? = null, templateId: Long? = null, voice: Boolean = false) =
        "compose?replyTo=${replyTo.enc()}&instruction=${instruction.enc()}&to=${to.enc()}&templateId=${templateId ?: -1}&voice=$voice"

    private fun String?.enc() = this?.let { Uri.encode(it) } ?: ""
}

@Composable
fun AuraNavHost(container: AppContainer, initialMailTo: String?) {
    val nav = rememberNavController()
    val settings by container.settings.collectAsStateWithLifecycle()

    LaunchedEffect(initialMailTo) {
        if (!initialMailTo.isNullOrBlank()) nav.navigate(Routes.compose(to = initialMailTo))
    }

    NavHost(
        navController = nav,
        startDestination = Routes.INBOX,
        enterTransition = { slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(280)) + fadeIn() },
        exitTransition = { fadeOut(tween(200)) },
        popEnterTransition = { fadeIn(tween(200)) },
        popExitTransition = { slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(280)) + fadeOut() },
    ) {
        composable(Routes.INBOX) {
            val vm: InboxViewModel = viewModel(factory = viewModelFactory { InboxViewModel(container) })
            InboxScreen(
                vm = vm,
                onOpenEmail = { nav.navigate("email/$it") },
                onCompose = { nav.navigate(Routes.compose()) },
                onSearch = { voice -> nav.navigate("search?voice=$voice") },
                onTemplates = { nav.navigate(Routes.TEMPLATES) },
                onSettings = { nav.navigate(Routes.SETTINGS) },
            )
        }

        composable(
            Routes.SEARCH,
            arguments = listOf(navArgument("voice") { type = NavType.BoolType; defaultValue = false }),
        ) { entry ->
            val vm: SearchViewModel = viewModel(factory = viewModelFactory { SearchViewModel(container) })
            SearchScreen(
                vm = vm,
                speechLanguage = settings.speechLanguage,
                startWithVoice = entry.arguments?.getBoolean("voice") == true,
                onBack = { nav.popBackStack() },
                onOpen = { nav.navigate("email/$it") },
            )
        }

        composable(Routes.READER, arguments = listOf(navArgument("id") { type = NavType.StringType })) { entry ->
            val id = entry.arguments?.getString("id").orEmpty()
            val vm: ReaderViewModel = viewModel(factory = viewModelFactory { ReaderViewModel(container, id) })
            ReaderScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
                onReply = { instruction, voice -> nav.navigate(Routes.compose(replyTo = id, instruction = instruction, voice = voice)) },
            )
        }

        composable(
            Routes.COMPOSE,
            arguments = listOf(
                navArgument("replyTo") { type = NavType.StringType; defaultValue = "" },
                navArgument("instruction") { type = NavType.StringType; defaultValue = "" },
                navArgument("to") { type = NavType.StringType; defaultValue = "" },
                navArgument("templateId") { type = NavType.LongType; defaultValue = -1L },
                navArgument("voice") { type = NavType.BoolType; defaultValue = false },
            ),
        ) { entry ->
            val a = entry.arguments
            val vm: ComposeViewModel = viewModel(factory = viewModelFactory {
                ComposeViewModel(
                    c = container,
                    replyToId = a?.getString("replyTo")?.takeIf { it.isNotBlank() },
                    initialInstruction = a?.getString("instruction")?.takeIf { it.isNotBlank() },
                    mailTo = a?.getString("to")?.takeIf { it.isNotBlank() },
                    templateId = a?.getLong("templateId")?.takeIf { it > 0 },
                )
            })
            ComposeScreen(
                vm = vm,
                speechLanguage = settings.speechLanguage,
                startWithVoice = a?.getBoolean("voice") == true,
                onClose = { nav.popBackStack() },
            )
        }

        composable(Routes.TEMPLATES) {
            TemplatesScreen(
                container = container,
                onBack = { nav.popBackStack() },
                onEdit = { id -> nav.navigate("template?id=${id ?: -1}") },
                onUse = { id -> nav.navigate(Routes.compose(templateId = id)) },
            )
        }

        composable(Routes.TEMPLATE_EDIT, arguments = listOf(navArgument("id") { type = NavType.LongType; defaultValue = -1L })) { entry ->
            TemplateEditorScreen(
                container = container,
                templateId = entry.arguments?.getLong("id")?.takeIf { it > 0 },
                onBack = { nav.popBackStack() },
            )
        }

        composable(Routes.SETTINGS) { SettingsScreen(container = container, onBack = { nav.popBackStack() }) }
    }
}
