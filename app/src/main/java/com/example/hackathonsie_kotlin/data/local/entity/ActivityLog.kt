package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Activity Logs - Audit trail for all actions
 * Critical for 40 points requirement - tracks all user actions
 */
@Entity(
    tableName = "activity_logs",
    foreignKeys = [
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["user_id"],
            onDelete = ForeignKey.SET_NULL
        ),
        ForeignKey(
            entity = Task::class,
            parentColumns = ["id"],
            childColumns = ["task_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Group::class,
            parentColumns = ["id"],
            childColumns = ["group_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["id"], unique = true),
        Index(value = ["user_id"]),
        Index(value = ["task_id"]),
        Index(value = ["group_id"]),
        Index(value = ["action"]),
        Index(value = ["timestamp"], orders = [Index.Order.DESC])
    ]
)
data class ActivityLog(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "user_id")
    val userId: String? = null,
    
    @ColumnInfo(name = "task_id")
    val taskId: String? = null,
    
    @ColumnInfo(name = "group_id")
    val groupId: String? = null,
    
    @ColumnInfo(name = "action")
    val action: ActivityAction,
    
    @ColumnInfo(name = "old_value")
    val oldValue: String? = null, // JSON string
    
    @ColumnInfo(name = "new_value")
    val newValue: String? = null, // JSON string
    
    @ColumnInfo(name = "metadata")
    val metadata: String? = null, // JSON string for IP, user agent, device info
    
    @ColumnInfo(name = "timestamp")
    val timestamp: Date
)

enum class ActivityAction {
    TASK_CREATED,
    TASK_UPDATED,
    TASK_ASSIGNED,
    TASK_DELETED,
    STATUS_CHANGED,
    PRIORITY_CHANGED,
    PROGRESS_UPDATED,
    GROUP_CREATED,
    GROUP_UPDATED,
    MEMBER_ADDED,
    MEMBER_REMOVED,
    COMMENT_ADDED
}
