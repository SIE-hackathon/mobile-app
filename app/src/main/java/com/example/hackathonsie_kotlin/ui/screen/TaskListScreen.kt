package com.example.hackathonsie_kotlin.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.hackathonsie_kotlin.data.local.entity.Task
import com.example.hackathonsie_kotlin.data.local.entity.TaskStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskListScreen(
    tasks: List<Task>,
    onTaskClick: (Task) -> Unit,
    onCreateTask: () -> Unit,
    onFilterChange: (TaskStatus?) -> Unit,
    onSearchQuery: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf<TaskStatus?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tasks") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateTask,
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Task")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    onSearchQuery(it)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search tasks...") },
                singleLine = true
            )

            // Filter chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedFilter == null,
                    onClick = {
                        selectedFilter = null
                        onFilterChange(null)
                    },
                    label = { Text("All") }
                )
                
                TaskStatus.values().forEach { status ->
                    FilterChip(
                        selected = selectedFilter == status,
                        onClick = {
                            selectedFilter = status
                            onFilterChange(status)
                        },
                        label = { Text(status.name.replace("_", " ")) }
                    )
                }
            }

            // Task list
            if (tasks.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No tasks found",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(tasks, key = { it.id }) { task ->
                        TaskCard(
                            task = task,
                            onClick = { onTaskClick(task) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TaskCard(
    task: Task,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Title
            Text(
                text = task.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Status and Priority chips
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Status chip
                AssistChip(
                    onClick = { },
                    label = { Text(task.status.name.replace("_", " ")) },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (task.status) {
                            TaskStatus.TODO -> MaterialTheme.colorScheme.secondaryContainer
                            TaskStatus.IN_PROGRESS -> MaterialTheme.colorScheme.primaryContainer
                            TaskStatus.REVIEW -> MaterialTheme.colorScheme.tertiaryContainer
                            TaskStatus.DONE -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    )
                )
                
                // Priority chip
                AssistChip(
                    onClick = { },
                    label = { Text(task.priority.name) },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (task.priority.name) {
                            "LOW" -> MaterialTheme.colorScheme.surfaceVariant
                            "MEDIUM" -> MaterialTheme.colorScheme.secondaryContainer
                            "HIGH" -> MaterialTheme.colorScheme.tertiaryContainer
                            "URGENT" -> MaterialTheme.colorScheme.errorContainer
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    )
                )
            }
            
            // Progress indicator if not 0
            if (task.progress > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    LinearProgressIndicator(
                        progress = task.progress / 100f,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${task.progress}%",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
            
            // Due date if present
            task.dueDate?.let { dueDate ->
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Due: ${android.text.format.DateFormat.getDateFormat(androidx.compose.ui.platform.LocalContext.current).format(dueDate)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
