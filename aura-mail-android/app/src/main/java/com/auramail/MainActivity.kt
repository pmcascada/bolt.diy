package com.auramail

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.auramail.ui.navigation.AuraNavHost
import com.auramail.ui.theme.AuraTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as AuraApp).container
        val mailto = intent?.data?.takeIf { it.scheme == "mailto" }?.schemeSpecificPart?.substringBefore('?')
        setContent {
            val settings by container.settings.collectAsStateWithLifecycle()
            AuraTheme(themeMode = settings.themeMode) {
                AuraNavHost(container = container, initialMailTo = mailto)
            }
        }
    }
}
