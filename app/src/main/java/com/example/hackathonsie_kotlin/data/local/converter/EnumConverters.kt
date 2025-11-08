package com.example.hackathonsie_kotlin.data.local.converter

import androidx.room.TypeConverter
import com.example.hackathonsie_kotlin.data.local.entity.*

/**
 * Type converters for all enum types
 * Required by Room to store enums in SQLite
 */
class EnumConverters {
    
    // TaskStatus converters
    @TypeConverter
    fun fromTaskStatus(status: TaskStatus): String {
        return status.name
    }

    @TypeConverter
    fun toTaskStatus(value: String): TaskStatus {
        return TaskStatus.valueOf(value)
    }

    // TaskPriority converters
    @TypeConverter
    fun fromTaskPriority(priority: TaskPriority): String {
        return priority.name
    }

    @TypeConverter
    fun toTaskPriority(value: String): TaskPriority {
        return TaskPriority.valueOf(value)
    }

    // MemberRole converters
    @TypeConverter
    fun fromMemberRole(role: MemberRole): String {
        return role.name
    }

    @TypeConverter
    fun toMemberRole(value: String): MemberRole {
        return MemberRole.valueOf(value)
    }

    // ActivityAction converters
    @TypeConverter
    fun fromActivityAction(action: ActivityAction): String {
        return action.name
    }

    @TypeConverter
    fun toActivityAction(value: String): ActivityAction {
        return ActivityAction.valueOf(value)
    }

    // AssignmentType converters
    @TypeConverter
    fun fromAssignmentType(type: AssignmentType): String {
        return type.name
    }

    @TypeConverter
    fun toAssignmentType(value: String): AssignmentType {
        return AssignmentType.valueOf(value)
    }

    // SyncOperation converters
    @TypeConverter
    fun fromSyncOperation(operation: SyncOperation): String {
        return operation.name
    }

    @TypeConverter
    fun toSyncOperation(value: String): SyncOperation {
        return SyncOperation.valueOf(value)
    }

    // SyncStatus converters
    @TypeConverter
    fun fromSyncStatus(status: SyncStatus): String {
        return status.name
    }

    @TypeConverter
    fun toSyncStatus(value: String): SyncStatus {
        return SyncStatus.valueOf(value)
    }
}
