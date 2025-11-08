package com.example.hackathonsie_kotlin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import com.example.hackathonsie_kotlin.data.local.AppDatabase
import com.example.hackathonsie_kotlin.data.local.entity.Task
import com.example.hackathonsie_kotlin.data.local.entity.TaskStatus
import com.example.hackathonsie_kotlin.data.repository.SyncManager
import com.example.hackathonsie_kotlin.data.repository.TaskRepository
import com.example.hackathonsie_kotlin.data.sync.SyncState
import com.example.hackathonsie_kotlin.ui.screen.TaskListScreen
import com.example.hackathonsie_kotlin.ui.screen.HomeScreen
import com.example.hackathonsie_kotlin.ui.screen.LoginScreen
import com.example.hackathonsie_kotlin.ui.screen.RegisterScreen
import com.example.hackathonsie_kotlin.ui.screen.SuccessScreen
import com.example.hackathonsie_kotlin.ui.screen.TaskFormScreen
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
                MainApp(syncManager)
            }
        }
    }
}

// Navigation bar items
data class NavigationItem(
    val title: String,
    val icon: ImageVector,
    val route: String
)

@Composable
fun MainApp(syncManager: SyncManager) {
    var isAuthenticated by remember { mutableStateOf(false) }
    var currentAuthScreen by remember { mutableStateOf("home") }
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var syncState by remember { mutableStateOf<SyncState>(SyncState.Idle) }
    var selectedTaskFilter by remember { mutableStateOf<TaskStatus?>(null) }
    var taskSearchQuery by remember { mutableStateOf("") }
    var showTaskForm by remember { mutableStateOf(false) }
    var tasks by remember { mutableStateOf<List<Task>>(emptyList()) }
    var isLoadingTasks by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val taskRepository = remember { TaskRepository() }

    val navigationItems = listOf(
        NavigationItem(
            title = "Dashboard",
            icon = Icons.Default.Home,
            route = "dashboard"
        ),
        NavigationItem(
            title = "Tasks",
            icon = Icons.Default.CheckCircle,
            route = "tasks"
        ),
        NavigationItem(
            title = "Account",
            icon = Icons.Default.AccountCircle,
            route = "account"
        )
    )

    val performSync: (onComplete: () -> Unit) -> Unit = { onComplete ->
        coroutineScope.launch(Dispatchers.IO) {
            syncState = SyncState.Syncing
            isLoadingTasks = true
            val result = syncManager.performFullSync()
            result.onSuccess {
                // Fetch tasks after successful sync
                val tasksResult = taskRepository.fetchUserTasks()
                tasksResult.onSuccess { fetchedTasks ->
                    tasks = fetchedTasks
                }
                syncState = SyncState.Success("Data synced successfully")
                isLoadingTasks = false
                launch(Dispatchers.Main) {
                    onComplete()
                }
            }
            result.onFailure { exception ->
                syncState = SyncState.Error(exception as Exception)
                isLoadingTasks = false
                launch(Dispatchers.Main) {
                    onComplete()
                }
            }
        }
    }

    if (!isAuthenticated) {
        // Authentication screens
        when (currentAuthScreen) {
            "home" -> HomeScreen(
                onNavigateToLogin = { currentAuthScreen = "login" },
                onNavigateToRegister = { currentAuthScreen = "register" }
            )
            "login" -> LoginScreen(
                onNavigateToSuccess = { currentAuthScreen = "success" },
                onNavigateToHome = { currentAuthScreen = "home" },
                onSyncRequired = { callback ->
                    performSync {
                        isAuthenticated = true
                        callback()
                    }
                }
            )
            "register" -> RegisterScreen(
                onNavigateToHome = { currentAuthScreen = "home" },
                onSyncRequired = { callback ->
                    performSync {
                        isAuthenticated = true
                        callback()
                    }
                }
            )
            "success" -> SuccessScreen(
                syncState = syncState,
                onNavigateToHome = { 
                    isAuthenticated = true
                }
            )
        }
    } else {
        // Main app with bottom navigation
        Scaffold(
            bottomBar = {
                NavigationBar {
                    navigationItems.forEachIndexed { index, item ->
                        NavigationBarItem(
                            icon = { 
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.title
                                )
                            },
                            label = { Text(item.title) },
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index }
                        )
                    }
                }
            },
            floatingActionButton = {
                // Show FAB only on Tasks tab
                if (selectedTabIndex == 1 && !showTaskForm) {
                    FloatingActionButton(
                        onClick = { showTaskForm = true },
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Create Task")
                    }
                }
            }
        ) { paddingValues ->
            // Content based on selected tab
            when (selectedTabIndex) {
                0 -> {
                    // Dashboard screen (placeholder for now)
                    Text(
                        text = "Dashboard - Coming Soon",
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                1 -> {
                    // Tasks screen - Integrated TaskListScreen or TaskFormScreen
                    if (showTaskForm) {
                        TaskFormScreen(
                            taskRepository = taskRepository,
                            onNavigateBack = { showTaskForm = false },
                            onTaskCreated = {
                                // Refresh tasks after creation
                                coroutineScope.launch(Dispatchers.IO) {
                                    isLoadingTasks = true
                                    val tasksResult = taskRepository.fetchUserTasks()
                                    tasksResult.onSuccess { fetchedTasks ->
                                        tasks = fetchedTasks
                                    }
                                    isLoadingTasks = false
                                }
                            },
                            modifier = Modifier.padding(paddingValues)
                        )
                    } else {
                        // Filter tasks based on search query and filter
                        val filteredTasks = tasks.filter { task ->
                            val matchesQuery = taskSearchQuery.isEmpty() || 
                                task.title.contains(taskSearchQuery, ignoreCase = true) ||
                                task.description?.contains(taskSearchQuery, ignoreCase = true) ?: false
                            val matchesFilter = selectedTaskFilter == null || task.status == selectedTaskFilter
                            matchesQuery && matchesFilter
                        }
                        
                        TaskListScreen(
                            tasks = filteredTasks,
                            onTaskClick = { task ->
                                // Navigate to task detail screen (to be implemented)
                            },
                            onCreateTask = {
                                // Show task form
                                showTaskForm = true
                            },
                            onFilterChange = { status ->
                                selectedTaskFilter = status
                            },
                            onSearchQuery = { query ->
                                taskSearchQuery = query
                            },
                            onStatusChange = { task, newStatus ->
                                // Update task status in Supabase
                                coroutineScope.launch(Dispatchers.IO) {
                                    isLoadingTasks = true
                                    val result = taskRepository.updateTaskStatus(task.id, newStatus)
                                    result.onSuccess {
                                        // Refresh tasks
                                        val tasksResult = taskRepository.fetchUserTasks()
                                        tasksResult.onSuccess { fetchedTasks ->
                                            tasks = fetchedTasks
                                        }
                                    }
                                    isLoadingTasks = false
                                }
                            },
                            onRefresh = {
                                // Pull to refresh
                                coroutineScope.launch(Dispatchers.IO) {
                                    isLoadingTasks = true
                                    val tasksResult = taskRepository.fetchUserTasks()
                                    tasksResult.onSuccess { fetchedTasks ->
                                        tasks = fetchedTasks
                                    }
                                    isLoadingTasks = false
                                }
                            },
                            isRefreshing = isLoadingTasks,
                            modifier = Modifier.padding(paddingValues)
                        )
                    }
                }
                2 -> {
                    // Account screen (placeholder for now)
                    Text(
                        text = "Account - Coming Soon",
                        modifier = Modifier.padding(paddingValues)
                    )
                }
            }
        }
    }
}


