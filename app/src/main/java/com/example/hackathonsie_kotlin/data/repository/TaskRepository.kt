package com.example.hackathonsie_kotlin.data.repository

import android.util.Log
import com.example.hackathonsie_kotlin.data.local.entity.Task
import com.example.hackathonsie_kotlin.data.local.entity.TaskPriority
import com.example.hackathonsie_kotlin.data.local.entity.TaskStatus
import com.example.hackathonsie_kotlin.data.remote.SupabaseClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Serializable data classes for Supabase API
 * Note: Supabase expects lowercase enum values (todo, in_progress, review, done)
 */
@Serializable
data class TaskInsertPayload(
    val id: String,
    val title: String,
    val description: String? = null,
    val status: String,
    val priority: String,
    val progress: Int,
    val due_date: String? = null,
    val created_by: String, // NOT NULL in Supabase
    val created_at: String,
    val updated_at: String
)

@Serializable
data class TaskUpdatePayload(
    val title: String? = null,
    val description: String? = null,
    val status: String? = null,
    val priority: String? = null,
    val progress: Int? = null,
    val due_date: String? = null,
    val updated_at: String
)

@Serializable
data class TaskStatusUpdatePayload(
    val status: String,
    val updated_at: String
)

/**
 * Repository for Task operations with Supabase
 * Direct API calls without local database caching
 */
class TaskRepository {
    
    private val TAG = "TaskRepository"
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
    
    /**
     * Convert TaskStatus enum to Supabase format (lowercase with underscores)
     */
    private fun taskStatusToSupabase(status: TaskStatus): String {
        return when (status) {
            TaskStatus.TODO -> "todo"
            TaskStatus.IN_PROGRESS -> "in_progress"
            TaskStatus.REVIEW -> "review"
            TaskStatus.DONE -> "done"
        }
    }
    
    /**
     * Convert TaskPriority enum to Supabase format (lowercase)
     */
    private fun taskPriorityToSupabase(priority: TaskPriority): String {
        return when (priority) {
            TaskPriority.LOW -> "low"
            TaskPriority.MEDIUM -> "medium"
            TaskPriority.HIGH -> "high"
            TaskPriority.URGENT -> "urgent"
        }
    }
    
    /**
     * Convert Supabase status string to TaskStatus enum
     */
    private fun supabaseToTaskStatus(status: String): TaskStatus {
        return when (status.lowercase()) {
            "todo" -> TaskStatus.TODO
            "in_progress" -> TaskStatus.IN_PROGRESS
            "review" -> TaskStatus.REVIEW
            "done" -> TaskStatus.DONE
            else -> TaskStatus.TODO
        }
    }
    
    /**
     * Convert Supabase priority string to TaskPriority enum
     */
    private fun supabaseToTaskPriority(priority: String): TaskPriority {
        return when (priority.lowercase()) {
            "low" -> TaskPriority.LOW
            "medium" -> TaskPriority.MEDIUM
            "high" -> TaskPriority.HIGH
            "urgent" -> TaskPriority.URGENT
            else -> TaskPriority.MEDIUM
        }
    }
    
    /**
     * Fetch all tasks for the current user from Supabase
     */
    suspend fun fetchUserTasks(): Result<List<Task>> {
        return try {
            val currentUserId = SupabaseClient.client.auth.currentUserOrNull()?.id
            
            Log.d(TAG, "Fetching tasks for user: $currentUserId")
            
            val tasksData = SupabaseClient.client.postgrest
                .from("tasks")
                .select()
                .decodeList<Map<String, Any?>>()
            
            val tasks = tasksData.mapNotNull { taskMap ->
                try {
                    Task(
                        id = taskMap["id"] as String,
                        title = taskMap["title"] as String,
                        description = taskMap["description"] as? String,
                        status = supabaseToTaskStatus(taskMap["status"] as? String ?: "todo"),
                        priority = supabaseToTaskPriority(taskMap["priority"] as? String ?: "medium"),
                        progress = (taskMap["progress"] as? Number)?.toInt() ?: 0,
                        dueDate = parseDate(taskMap["due_date"] as? String),
                        createdBy = taskMap["created_by"] as? String,
                        createdAt = parseDate(taskMap["created_at"] as? String) ?: Date(),
                        updatedAt = parseDate(taskMap["updated_at"] as? String) ?: Date()
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing task: ${e.message}")
                    null
                }
            }
            
            Log.d(TAG, "Fetched ${tasks.size} tasks")
            Result.success(tasks)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch tasks: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    /**
     * Create a new task in Supabase
     */
    suspend fun createTask(
        title: String,
        description: String?,
        status: TaskStatus,
        priority: TaskPriority,
        dueDate: Date?
    ): Result<Task> {
        return try {
            val taskId = java.util.UUID.randomUUID().toString()
            val now = Date()
            val currentUserId = SupabaseClient.client.auth.currentUserOrNull()?.id
            
            // created_by is NOT NULL in Supabase, so we must have a user
            if (currentUserId == null) {
                return Result.failure(Exception("User must be authenticated to create tasks"))
            }
            
            val payload = TaskInsertPayload(
                id = taskId,
                title = title,
                description = description,
                status = taskStatusToSupabase(status),
                priority = taskPriorityToSupabase(priority),
                progress = 0,
                due_date = dueDate?.let { formatDate(it) },
                created_by = currentUserId,
                created_at = formatDate(now),
                updated_at = formatDate(now)
            )
            
            SupabaseClient.client.postgrest.from("tasks").insert(payload)
            
            val task = Task(
                id = taskId,
                title = title,
                description = description,
                status = status,
                priority = priority,
                progress = 0,
                dueDate = dueDate,
                createdBy = currentUserId,
                createdAt = now,
                updatedAt = now
            )
            
            Log.d(TAG, "Task created successfully: $taskId")
            Result.success(task)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create task: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    /**
     * Update task status in Supabase
     */
    suspend fun updateTaskStatus(taskId: String, newStatus: TaskStatus): Result<Unit> {
        return try {
            val now = Date()
            val payload = TaskStatusUpdatePayload(
                status = taskStatusToSupabase(newStatus),
                updated_at = formatDate(now)
            )
            
            SupabaseClient.client.postgrest
                .from("tasks")
                .update(payload) {
                    filter {
                        eq("id", taskId)
                    }
                }
            
            Log.d(TAG, "Task status updated: $taskId -> $newStatus")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update task status: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    /**
     * Update an existing task in Supabase
     */
    suspend fun updateTask(
        taskId: String,
        title: String,
        description: String?,
        status: TaskStatus,
        priority: TaskPriority,
        progress: Int,
        dueDate: Date?
    ): Result<Unit> {
        return try {
            val now = Date()
            val payload = TaskUpdatePayload(
                title = title,
                description = description,
                status = taskStatusToSupabase(status),
                priority = taskPriorityToSupabase(priority),
                progress = progress,
                due_date = dueDate?.let { formatDate(it) },
                updated_at = formatDate(now)
            )
            
            SupabaseClient.client.postgrest
                .from("tasks")
                .update(payload) {
                    filter {
                        eq("id", taskId)
                    }
                }
            
            Log.d(TAG, "Task updated successfully: $taskId")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update task: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    /**
     * Delete a task from Supabase
     */
    suspend fun deleteTask(taskId: String): Result<Unit> {
        return try {
            SupabaseClient.client.postgrest
                .from("tasks")
                .delete {
                    filter {
                        eq("id", taskId)
                    }
                }
            
            Log.d(TAG, "Task deleted successfully: $taskId")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete task: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    private fun parseDate(dateString: String?): Date? {
        if (dateString == null) return null
        return try {
            dateFormat.parse(dateString)
        } catch (e: Exception) {
            null
        }
    }
    
    private fun formatDate(date: Date): String {
        return dateFormat.format(date)
    }
}
