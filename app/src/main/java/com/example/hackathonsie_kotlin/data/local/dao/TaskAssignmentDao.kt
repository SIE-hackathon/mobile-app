package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.AssignmentType
import com.example.hackathonsie_kotlin.data.local.entity.TaskAssignment
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Task Assignment operations
 * Required for tracking "minimum 3 assignments" requirement
 */
@Dao
interface TaskAssignmentDao {
    
    @Query("SELECT * FROM task_assignments WHERE id = :assignmentId")
    suspend fun getTaskAssignment(assignmentId: String): TaskAssignment?
    
    @Query("SELECT * FROM task_assignments WHERE task_id = :taskId ORDER BY assigned_at DESC")
    fun getTaskAssignmentHistory(taskId: String): Flow<List<TaskAssignment>>
    
    @Query("SELECT * FROM task_assignments WHERE assigned_to_user = :userId ORDER BY assigned_at DESC")
    fun getUserAssignments(userId: String): Flow<List<TaskAssignment>>
    
    @Query("SELECT * FROM task_assignments WHERE assigned_to_group = :groupId ORDER BY assigned_at DESC")
    fun getGroupAssignments(groupId: String): Flow<List<TaskAssignment>>
    
    @Query("SELECT * FROM task_assignments WHERE assignment_type = :type ORDER BY assigned_at DESC")
    fun getAssignmentsByType(type: AssignmentType): Flow<List<TaskAssignment>>
    
    @Query("SELECT COUNT(*) FROM task_assignments WHERE task_id = :taskId")
    suspend fun getAssignmentCount(taskId: String): Int
    
    @Query("SELECT * FROM task_assignments WHERE task_id = :taskId ORDER BY assigned_at DESC LIMIT 1")
    suspend fun getLatestAssignment(taskId: String): TaskAssignment?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTaskAssignment(taskAssignment: TaskAssignment)
    
    @Update
    suspend fun updateTaskAssignment(taskAssignment: TaskAssignment)
    
    @Delete
    suspend fun deleteTaskAssignment(taskAssignment: TaskAssignment)
}
