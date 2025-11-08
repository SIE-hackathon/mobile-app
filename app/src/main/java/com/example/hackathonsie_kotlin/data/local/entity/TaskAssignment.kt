package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Task Assignments - Track all assignment changes
 * Required for "minimum 3 assignments" requirement
 */
@Entity(
    tableName = "task_assignments",
    foreignKeys = [
        ForeignKey(
            entity = Task::class,
            parentColumns = ["id"],
            childColumns = ["task_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["assigned_from"],
            onDelete = ForeignKey.SET_NULL
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
        )
    ],
    indices = [
        Index(value = ["id"], unique = true),
        Index(value = ["task_id"]),
        Index(value = ["assigned_to_user"]),
        Index(value = ["assigned_to_group"])
    ]
)
data class TaskAssignment(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "task_id")
    val taskId: String,
    
    @ColumnInfo(name = "assigned_from")
    val assignedFrom: String? = null,
    
    @ColumnInfo(name = "assigned_to_user")
    val assignedToUser: String? = null,
    
    @ColumnInfo(name = "assigned_to_group")
    val assignedToGroup: String? = null,
    
    @ColumnInfo(name = "assignment_type")
    val assignmentType: AssignmentType,
    
    @ColumnInfo(name = "assigned_at")
    val assignedAt: Date
)

enum class AssignmentType {
    MANUAL,
    AUTO,
    REASSIGN
}
