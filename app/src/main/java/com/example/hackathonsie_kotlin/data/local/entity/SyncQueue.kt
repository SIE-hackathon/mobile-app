package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Sync Queue - Track local changes that need server sync
 * Essential for offline support functionality
 */
@Entity(
    tableName = "sync_queue",
    foreignKeys = [
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["user_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["id"], unique = true),
        Index(value = ["user_id"]),
        Index(value = ["sync_status"]),
        Index(value = ["entity_type", "entity_id"])
    ]
)
data class SyncQueue(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "user_id")
    val userId: String,
    
    @ColumnInfo(name = "entity_type")
    val entityType: String, // 'task', 'group', etc.
    
    @ColumnInfo(name = "entity_id")
    val entityId: String,
    
    @ColumnInfo(name = "operation")
    val operation: SyncOperation,
    
    @ColumnInfo(name = "data")
    val data: String, // JSON string of the actual changes
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Date,
    
    @ColumnInfo(name = "synced_at")
    val syncedAt: Date? = null
)

enum class SyncOperation {
    CREATE,
    UPDATE,
    DELETE
}

enum class SyncStatus {
    PENDING,
    SYNCED,
    CONFLICT
}
