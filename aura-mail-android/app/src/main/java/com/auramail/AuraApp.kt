package com.auramail

import android.app.Application
import com.auramail.di.AppContainer
import kotlinx.coroutines.launch

class AuraApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        container.appScope.launch {
            container.templates.seedIfEmpty()
            container.auth.restore()
        }
    }
}
