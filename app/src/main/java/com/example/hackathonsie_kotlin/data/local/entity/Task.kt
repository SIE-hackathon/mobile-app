package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Tasks - Core task management entity
 * Supports E2EE with encrypted description, subtasks, and flexible assignment
 */
@Entity(
    tableName = "tasks",
    foreignKeys = [
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["created_by"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["assigned_to_user"],
            onDelete = ForeignKey.SET_NULL
        ),
        ForeignKey(
            entity = Group::class,
            parentColumns = ["id"],
            childColumns = ["assigned_to_group"],
            onDelete = ForeignKey.SET_NULL
        ),
        ForeignKey(
            entity = Task::class,
            parentColumns = ["id"],
            childColumns = ["parent_task_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["id"], unique = true),
        Index(value = ["status"]),
        Index(value = ["priority"]),
        Index(value = ["due_date"]),
        Index(value = ["created_by"]),
        Index(value = ["assigned_to_user"]),
        Index(value = ["assigned_to_group"]),
        Index(value = ["parent_task_id"])
    ]
)
data class Task(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "title")
    val title: String,
    
    @ColumnInfo(name = "description")
    val description: String? = null, // Plaintext version
    
    @ColumnInfo(name = "description_encrypted")
    val descriptionEncrypted: String? = null, // E2EE version
    
    @ColumnInfo(name = "status")
    val status: TaskStatus,
    
    @ColumnInfo(name = "priority")
    val priority: TaskPriority,
    
    @ColumnInfo(name = "progress")
    val progress: Int = 0, // 0-100
    
    @ColumnInfo(name = "due_date")
    val dueDate: Date? = null,
    
    @ColumnInfo(name = "created_by")
    val createdBy: String,
    
    @ColumnInfo(name = "assigned_to_user")
    val assignedToUser: String? = null,
    
    @ColumnInfo(name = "assigned_to_group")
    val assignedToGroup: String? = null,
    
    @ColumnInfo(name = "parent_task_id")
    val parentTaskId: String? = null,
    
    @ColumnInfo(name = "encryption_metadata")
    val encryptionMetadata: String? = null, // JSON string for keys/IVs
    
    @ColumnInfo(name = "created_at")
    val createdAt: Date,
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Date
)

enum class TaskStatus {
    TODO,
    IN_PROGRESS,
    REVIEW,
    DONE
}

enum class TaskPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}
