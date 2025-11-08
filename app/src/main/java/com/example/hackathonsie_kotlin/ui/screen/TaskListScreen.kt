package com.example.hackathonsie_kotlin.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
    onStatusChange: (Task, TaskStatus) -> Unit = { _, _ -> },
    onRefresh: () -> Unit = {},
    isRefreshing: Boolean = false,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf<TaskStatus?>(null) }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 16.dp)
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
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    selected = selectedFilter == null,
                    onClick = {
                        selectedFilter = null
                        onFilterChange(null)
                    },
                    label = { Text("All") }
                )
            }
            
            items(TaskStatus.values()) { status ->
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
                        onClick = { onTaskClick(task) },
                        onStatusChange = { newStatus ->
                            onStatusChange(task, newStatus)
                        }
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
    onStatusChange: (TaskStatus) -> Unit = {},
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
            // Title and status change button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f)
                )
                
                // Status change button
                IconButton(
                    onClick = {
                        // Cycle through statuses: TODO -> IN_PROGRESS -> REVIEW -> DONE -> TODO
                        val nextStatus = when (task.status) {
                            TaskStatus.TODO -> TaskStatus.IN_PROGRESS
                            TaskStatus.IN_PROGRESS -> TaskStatus.REVIEW
                            TaskStatus.REVIEW -> TaskStatus.DONE
                            TaskStatus.DONE -> TaskStatus.TODO
                        }
                        onStatusChange(nextStatus)
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Change status",
                        tint = when (task.status) {
                            TaskStatus.TODO -> MaterialTheme.colorScheme.secondary
                            TaskStatus.IN_PROGRESS -> MaterialTheme.colorScheme.primary
                            TaskStatus.REVIEW -> MaterialTheme.colorScheme.tertiary
                            TaskStatus.DONE -> MaterialTheme.colorScheme.outline
                        }
                    )
                }
            }
            
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
                        progress = { task.progress / 100f },
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
