package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.ActivityAction
import com.example.hackathonsie_kotlin.data.local.entity.ActivityLog
import kotlinx.coroutines.flow.Flow
import java.util.Date

/**
 * DAO for Activity Log operations
 * Critical for 40 points audit trail requirement
 */
@Dao
interface ActivityLogDao {
    
    @Query("SELECT * FROM activity_logs WHERE id = :logId")
    suspend fun getActivityLog(logId: String): ActivityLog?
    
    @Query("SELECT * FROM activity_logs ORDER BY timestamp DESC")
    fun getAllActivityLogs(): Flow<List<ActivityLog>>
    
    @Query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentActivityLogs(limit: Int): Flow<List<ActivityLog>>
    
    // User activity history
    @Query("SELECT * FROM activity_logs WHERE user_id = :userId ORDER BY timestamp DESC")
    fun getUserActivityLogs(userId: String): Flow<List<ActivityLog>>
    
    // Task history
    @Query("SELECT * FROM activity_logs WHERE task_id = :taskId ORDER BY timestamp DESC")
    fun getTaskActivityLogs(taskId: String): Flow<List<ActivityLog>>
    
    // Group activity
    @Query("SELECT * FROM activity_logs WHERE group_id = :groupId ORDER BY timestamp DESC")
    fun getGroupActivityLogs(groupId: String): Flow<List<ActivityLog>>
    
    // Filter by action type
    @Query("SELECT * FROM activity_logs WHERE action = :action ORDER BY timestamp DESC")
    fun getActivityLogsByAction(action: ActivityAction): Flow<List<ActivityLog>>
    
    // Date range queries
    @Query("SELECT * FROM activity_logs WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp DESC")
    fun getActivityLogsByDateRange(startDate: Date, endDate: Date): Flow<List<ActivityLog>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivityLog(activityLog: ActivityLog)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivityLogs(activityLogs: List<ActivityLog>)
    
    @Delete
    suspend fun deleteActivityLog(activityLog: ActivityLog)
    
    @Query("DELETE FROM activity_logs WHERE timestamp < :date")
    suspend fun deleteOldActivityLogs(date: Date)
}
