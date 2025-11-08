package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.Task
import com.example.hackathonsie_kotlin.data.local.entity.TaskPriority
import com.example.hackathonsie_kotlin.data.local.entity.TaskStatus
import kotlinx.coroutines.flow.Flow
import java.util.Date

/**
 * DAO for Task operations
 * Critical for Kanban board, calendar views, and task management
 */
@Dao
interface TaskDao {
    
    @Query("SELECT * FROM tasks WHERE id = :taskId")
    suspend fun getTask(taskId: String): Task?
    
    @Query("SELECT * FROM tasks WHERE id = :taskId")
    fun getTaskFlow(taskId: String): Flow<Task?>
    
    @Query("SELECT * FROM tasks")
    fun getAllTasks(): Flow<List<Task>>
    
    // Kanban board queries
    @Query("SELECT * FROM tasks WHERE status = :status ORDER BY priority DESC, due_date ASC")
    fun getTasksByStatus(status: TaskStatus): Flow<List<Task>>
    
    @Query("SELECT * FROM tasks WHERE priority = :priority ORDER BY due_date ASC")
    fun getTasksByPriority(priority: TaskPriority): Flow<List<Task>>
    
    // User's tasks
    @Query("SELECT * FROM tasks WHERE created_by = :userId ORDER BY created_at DESC")
    fun getTasksCreatedBy(userId: String): Flow<List<Task>>
    
    @Query("SELECT * FROM tasks WHERE assigned_to_user = :userId ORDER BY due_date ASC")
    fun getTasksAssignedToUser(userId: String): Flow<List<Task>>
    
    // Group tasks
    @Query("SELECT * FROM tasks WHERE assigned_to_group = :groupId ORDER BY due_date ASC")
    fun getTasksAssignedToGroup(groupId: String): Flow<List<Task>>
    
    // Subtasks
    @Query("SELECT * FROM tasks WHERE parent_task_id = :parentId")
    fun getSubtasks(parentId: String): Flow<List<Task>>
    
    // Calendar view
    @Query("SELECT * FROM tasks WHERE due_date BETWEEN :startDate AND :endDate ORDER BY due_date ASC")
    fun getTasksByDateRange(startDate: Date, endDate: Date): Flow<List<Task>>
    
    @Query("SELECT * FROM tasks WHERE due_date < :date AND status != 'DONE' ORDER BY due_date ASC")
    fun getOverdueTasks(date: Date): Flow<List<Task>>
    
    // Search
    @Query("SELECT * FROM tasks WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    fun searchTasks(query: String): Flow<List<Task>>
    
    // Combined filters for advanced queries
    @Query("""
        SELECT * FROM tasks 
        WHERE (:userId IS NULL OR created_by = :userId OR assigned_to_user = :userId)
        AND (:status IS NULL OR status = :status)
        AND (:priority IS NULL OR priority = :priority)
        ORDER BY priority DESC, due_date ASC
    """)
    fun getFilteredTasks(
        userId: String?,
        status: TaskStatus?,
        priority: TaskPriority?
    ): Flow<List<Task>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: Task)
    
    @Update
    suspend fun updateTask(task: Task)
    
    @Delete
    suspend fun deleteTask(task: Task)
    
    @Query("UPDATE tasks SET status = :status, updated_at = :updatedAt WHERE id = :taskId")
    suspend fun updateTaskStatus(taskId: String, status: TaskStatus, updatedAt: Date)
    
    @Query("UPDATE tasks SET progress = :progress, updated_at = :updatedAt WHERE id = :taskId")
    suspend fun updateTaskProgress(taskId: String, progress: Int, updatedAt: Date)
}
