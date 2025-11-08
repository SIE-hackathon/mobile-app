package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.SyncOperation
import com.example.hackathonsie_kotlin.data.local.entity.SyncQueue
import com.example.hackathonsie_kotlin.data.local.entity.SyncStatus
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Sync Queue operations
 * Essential for offline support functionality
 */
@Dao
interface SyncQueueDao {
    
    @Query("SELECT * FROM sync_queue WHERE id = :queueId")
    suspend fun getSyncQueueItem(queueId: String): SyncQueue?
    
    @Query("SELECT * FROM sync_queue ORDER BY created_at ASC")
    fun getAllSyncQueueItems(): Flow<List<SyncQueue>>
    
    @Query("SELECT * FROM sync_queue WHERE user_id = :userId ORDER BY created_at ASC")
    fun getUserSyncQueue(userId: String): Flow<List<SyncQueue>>
    
    @Query("SELECT * FROM sync_queue WHERE sync_status = :status ORDER BY created_at ASC")
    fun getSyncQueueByStatus(status: SyncStatus): Flow<List<SyncQueue>>
    
    @Query("SELECT * FROM sync_queue WHERE sync_status = 'PENDING' ORDER BY created_at ASC")
    suspend fun getPendingSyncItems(): List<SyncQueue>
    
    @Query("SELECT * FROM sync_queue WHERE entity_type = :entityType AND entity_id = :entityId")
    suspend fun getSyncQueueByEntity(entityType: String, entityId: String): List<SyncQueue>
    
    @Query("SELECT * FROM sync_queue WHERE sync_status = 'CONFLICT'")
    fun getConflictedItems(): Flow<List<SyncQueue>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSyncQueueItem(syncQueue: SyncQueue)
    
    @Update
    suspend fun updateSyncQueueItem(syncQueue: SyncQueue)
    
    @Delete
    suspend fun deleteSyncQueueItem(syncQueue: SyncQueue)
    
    @Query("UPDATE sync_queue SET sync_status = :status, synced_at = :syncedAt WHERE id = :queueId")
    suspend fun updateSyncStatus(queueId: String, status: SyncStatus, syncedAt: java.util.Date?)
    
    @Query("DELETE FROM sync_queue WHERE sync_status = 'SYNCED'")
    suspend fun clearSyncedItems()
}
