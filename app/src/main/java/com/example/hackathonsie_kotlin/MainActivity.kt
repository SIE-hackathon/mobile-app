package com.example.hackathonsie_kotlin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.example.hackathonsie_kotlin.data.local.AppDatabase
import com.example.hackathonsie_kotlin.data.repository.SyncManager
import com.example.hackathonsie_kotlin.data.sync.SyncState
import com.example.hackathonsie_kotlin.ui.screen.HomeScreen
import com.example.hackathonsie_kotlin.ui.screen.LoginScreen
import com.example.hackathonsie_kotlin.ui.screen.RegisterScreen
import com.example.hackathonsie_kotlin.ui.screen.SuccessScreen
import com.example.hackathonsie_kotlin.ui.theme.HackathonSIEkotlinTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    
    private lateinit var database: AppDatabase
    private lateinit var syncManager: SyncManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize database and sync manager
        database = AppDatabase.getInstance(this)
        syncManager = SyncManager(database)
        
        enableEdgeToEdge()
        setContent {
            HackathonSIEkotlinTheme {
                NavigationHost(syncManager)
            }
        }
    }
}

@Composable
fun NavigationHost(syncManager: SyncManager) {
    var currentScreen by remember { mutableStateOf("home") }
    var syncState by remember { mutableStateOf<SyncState>(SyncState.Idle) }
    val coroutineScope = rememberCoroutineScope()

    val performSync: (onComplete: () -> Unit) -> Unit = { onComplete ->
        coroutineScope.launch(Dispatchers.IO) {
            syncState = SyncState.Syncing
            val result = syncManager.performFullSync()
            result.onSuccess {
                syncState = SyncState.Success("Data synced successfully")
                launch(Dispatchers.Main) {
                    onComplete()
                }
            }
            result.onFailure { exception ->
                syncState = SyncState.Error(exception as Exception)
                launch(Dispatchers.Main) {
                    onComplete()
                }
            }
        }
    }

    when (currentScreen) {
        "home" -> HomeScreen(
            onNavigateToLogin = { currentScreen = "login" },
            onNavigateToRegister = { currentScreen = "register" }
        )
        "login" -> LoginScreen(
            onNavigateToSuccess = { currentScreen = "success" },
            onNavigateToHome = { currentScreen = "home" },
            onSyncRequired = performSync
        )
        "register" -> RegisterScreen(
            onNavigateToHome = { currentScreen = "home" },
            onSyncRequired = performSync
        )
        "success" -> SuccessScreen(
            onNavigateToHome = { currentScreen = "home" },
            syncState = syncState
        )
    }
}


