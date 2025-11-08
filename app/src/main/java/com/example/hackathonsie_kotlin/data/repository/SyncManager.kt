package com.example.hackathonsie_kotlin.data.repository

import android.util.Log
import com.example.hackathonsie_kotlin.data.local.AppDatabase
import com.example.hackathonsie_kotlin.data.local.entity.*
import com.example.hackathonsie_kotlin.data.remote.SupabaseClient
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.JsonElement
import java.util.Date

class SyncManager(private val database: AppDatabase) {

    companion object {
        private const val TAG = "SyncManager"
    }

    /**
     * Perform a full sync: push local changes to Supabase, then pull fresh data
     */
    suspend fun performFullSync(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Starting full sync")
            
            // Step 1: Push pending changes to Supabase
            pushPendingChanges()
            
            // Step 2: Pull fresh data from Supabase
            pullFreshData()
            
            Log.d(TAG, "Full sync completed successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Full sync failed: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Push all pending changes from SyncQueue to Supabase
     */
    private suspend fun pushPendingChanges() {
        val pendingOps = database.syncQueueDao().getPendingSyncItems()
        
        pendingOps.forEach { operation ->
            try {
                Log.d(TAG, "Processing sync operation: ${operation.id}")
                
                when (operation.operation) {
                    SyncOperation.CREATE -> pushInsert(operation)
                    SyncOperation.UPDATE -> pushUpdate(operation)
                    SyncOperation.DELETE -> pushDelete(operation)
                }
                
                // Mark as synced
                database.syncQueueDao().updateSyncStatus(
                    operation.id,
                    SyncStatus.SYNCED,
                    Date()
                )
                Log.d(TAG, "Marked operation as synced: ${operation.id}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to push operation ${operation.id}: ${e.message}", e)
            }
        }
    }

    /**
     * Push an INSERT operation to Supabase
     */
    private suspend fun pushInsert(operation: SyncQueue) {
        val payload: Map<String, Any?> = try {
            val jsonElement = Json.parseToJsonElement(operation.data)
            jsonElement.jsonObject.toMap()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse JSON data: ${e.message}")
            return
        }
        
        when (operation.entityType) {
            "user_profile" -> SupabaseClient.client.from("user_profile").insert(payload)
            "group" -> SupabaseClient.client.from("group").insert(payload)
            "task" -> SupabaseClient.client.from("task").insert(payload)
            "group_member" -> SupabaseClient.client.from("group_member").insert(payload)
            "task_assignment" -> SupabaseClient.client.from("task_assignment").insert(payload)
            "activity_log" -> SupabaseClient.client.from("activity_log").insert(payload)
        }
    }

    /**
     * Push an UPDATE operation to Supabase
     */
    private suspend fun pushUpdate(operation: SyncQueue) {
        val payload: Map<String, Any?> = try {
            val jsonElement = Json.parseToJsonElement(operation.data)
            jsonElement.jsonObject.toMap()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse JSON data: ${e.message}")
            return
        }
        
        when (operation.entityType) {
            "user_profile" -> {
                SupabaseClient.client.from("user_profile")
                    .update(payload) {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "group" -> {
                SupabaseClient.client.from("group")
                    .update(payload) {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "task" -> {
                SupabaseClient.client.from("task")
                    .update(payload) {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "group_member" -> {
                SupabaseClient.client.from("group_member")
                    .update(payload) {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "task_assignment" -> {
                SupabaseClient.client.from("task_assignment")
                    .update(payload) {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "activity_log" -> {
                SupabaseClient.client.from("activity_log")
                    .update(payload) {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
        }
    }

    /**
     * Push a DELETE operation to Supabase
     */
    private suspend fun pushDelete(operation: SyncQueue) {
        when (operation.entityType) {
            "user_profile" -> {
                SupabaseClient.client.from("user_profile")
                    .delete {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "group" -> {
                SupabaseClient.client.from("group")
                    .delete {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "task" -> {
                SupabaseClient.client.from("task")
                    .delete {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "group_member" -> {
                SupabaseClient.client.from("group_member")
                    .delete {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "task_assignment" -> {
                SupabaseClient.client.from("task_assignment")
                    .delete {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
            "activity_log" -> {
                SupabaseClient.client.from("activity_log")
                    .delete {
                        filter {
                            eq("id", operation.entityId)
                        }
                    }
            }
        }
    }

    /**
     * Pull fresh data from Supabase (overwrite local with server data)
     */
    private suspend fun pullFreshData() {
        try {
            Log.d(TAG, "Pulling fresh data from Supabase")
            
            pullUserProfiles()
            pullGroups()
            pullGroupMembers()
            pullTasks()
            pullTaskAssignments()
            pullActivityLogs()
            
            Log.d(TAG, "Fresh data pull completed")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull fresh data: ${e.message}", e)
            throw e
        }
    }

    private suspend fun pullUserProfiles() {
        try {
            val profiles = SupabaseClient.client
                .from("user_profile")
                .select()
                .decodeList<Map<String, Any?>>()
            
            Log.d(TAG, "Pulled ${profiles.size} user profiles")
            
            profiles.forEach { profileMap ->
                try {
                    val profile = UserProfile(
                        id = profileMap["id"] as String,
                        displayName = profileMap["display_name"] as String,
                        avatarUrl = profileMap["avatar_url"] as? String,
                        publicKey = profileMap["public_key"] as String,
                        createdAt = parseDate(profileMap["created_at"] as? String),
                        updatedAt = parseDate(profileMap["updated_at"] as? String)
                    )
                    database.userProfileDao().insertUserProfile(profile)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing user profile: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull user profiles: ${e.message}")
        }
    }

    private suspend fun pullGroups() {
        try {
            val groups = SupabaseClient.client
                .from("group")
                .select()
                .decodeList<Map<String, Any?>>()
            
            Log.d(TAG, "Pulled ${groups.size} groups")
            
            groups.forEach { groupMap ->
                try {
                    val group = Group(
                        id = groupMap["id"] as String,
                        name = groupMap["name"] as String,
                        description = groupMap["description"] as? String,
                        ownerId = groupMap["owner_id"] as String,
                        parentGroupId = groupMap["parent_group_id"] as? String,
                        createdAt = parseDate(groupMap["created_at"] as? String),
                        updatedAt = parseDate(groupMap["updated_at"] as? String)
                    )
                    database.groupDao().insertGroup(group)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing group: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull groups: ${e.message}")
        }
    }

    private suspend fun pullGroupMembers() {
        try {
            val members = SupabaseClient.client
                .from("group_member")
                .select()
                .decodeList<Map<String, Any?>>()
            
            Log.d(TAG, "Pulled ${members.size} group members")
            
            members.forEach { memberMap ->
                try {
                    val role = when (memberMap["role"] as? String) {
                        "OWNER" -> MemberRole.OWNER
                        "ADMIN" -> MemberRole.ADMIN
                        else -> MemberRole.MEMBER
                    }
                    
                    val member = GroupMember(
                        id = memberMap["id"] as String,
                        groupId = memberMap["group_id"] as String,
                        userId = memberMap["user_id"] as String,
                        role = role,
                        joinedAt = parseDate(memberMap["joined_at"] as? String)
                    )
                    database.groupMemberDao().insertGroupMember(member)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing group member: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull group members: ${e.message}")
        }
    }

    private suspend fun pullTasks() {
        try {
            val tasks = SupabaseClient.client
                .from("task")
                .select()
                .decodeList<Map<String, Any?>>()
            
            Log.d(TAG, "Pulled ${tasks.size} tasks")
            
            tasks.forEach { taskMap ->
                try {
                    val status = when (taskMap["status"] as? String) {
                        "TODO" -> TaskStatus.TODO
                        "IN_PROGRESS" -> TaskStatus.IN_PROGRESS
                        "REVIEW" -> TaskStatus.REVIEW
                        "DONE" -> TaskStatus.DONE
                        else -> TaskStatus.TODO
                    }
                    
                    val priority = when (taskMap["priority"] as? String) {
                        "LOW" -> TaskPriority.LOW
                        "MEDIUM" -> TaskPriority.MEDIUM
                        "HIGH" -> TaskPriority.HIGH
                        "URGENT" -> TaskPriority.URGENT
                        else -> TaskPriority.MEDIUM
                    }
                    
                    val task = Task(
                        id = taskMap["id"] as String,
                        title = taskMap["title"] as String,
                        description = taskMap["description"] as? String,
                        descriptionEncrypted = taskMap["description_encrypted"] as? String,
                        status = status,
                        priority = priority,
                        progress = (taskMap["progress"] as? Number)?.toInt() ?: 0,
                        dueDate = parseDate(taskMap["due_date"] as? String),
                        createdBy = taskMap["created_by"] as String,
                        assignedToUser = taskMap["assigned_to_user"] as? String,
                        assignedToGroup = taskMap["assigned_to_group"] as? String,
                        parentTaskId = taskMap["parent_task_id"] as? String,
                        encryptionMetadata = taskMap["encryption_metadata"] as? String,
                        createdAt = parseDate(taskMap["created_at"] as? String),
                        updatedAt = parseDate(taskMap["updated_at"] as? String)
                    )
                    database.taskDao().insertTask(task)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing task: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull tasks: ${e.message}")
        }
    }

    private suspend fun pullTaskAssignments() {
        try {
            val assignments = SupabaseClient.client
                .from("task_assignment")
                .select()
                .decodeList<Map<String, Any?>>()
            
            Log.d(TAG, "Pulled ${assignments.size} task assignments")
            
            assignments.forEach { assignmentMap ->
                try {
                    val assignmentType = when (assignmentMap["assignment_type"] as? String) {
                        "AUTO" -> AssignmentType.AUTO
                        "REASSIGN" -> AssignmentType.REASSIGN
                        else -> AssignmentType.MANUAL
                    }
                    
                    val assignment = TaskAssignment(
                        id = assignmentMap["id"] as String,
                        taskId = assignmentMap["task_id"] as String,
                        assignedFrom = assignmentMap["assigned_from"] as? String,
                        assignedToUser = assignmentMap["assigned_to_user"] as? String,
                        assignedToGroup = assignmentMap["assigned_to_group"] as? String,
                        assignmentType = assignmentType,
                        assignedAt = parseDate(assignmentMap["assigned_at"] as? String)
                    )
                    database.taskAssignmentDao().insertTaskAssignment(assignment)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing task assignment: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull task assignments: ${e.message}")
        }
    }

    private suspend fun pullActivityLogs() {
        try {
            val logs = SupabaseClient.client
                .from("activity_log")
                .select()
                .decodeList<Map<String, Any?>>()
            
            Log.d(TAG, "Pulled ${logs.size} activity logs")
            
            logs.forEach { logMap ->
                try {
                    val action = try {
                        ActivityAction.valueOf(logMap["action"] as String)
                    } catch (e: Exception) {
                        ActivityAction.TASK_CREATED
                    }
                    
                    val log = ActivityLog(
                        id = logMap["id"] as String,
                        userId = logMap["user_id"] as? String,
                        taskId = logMap["task_id"] as? String,
                        groupId = logMap["group_id"] as? String,
                        action = action,
                        timestamp = parseDate(logMap["created_at"] as? String)
                    )
                    database.activityLogDao().insertActivityLog(log)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing activity log: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to pull activity logs: ${e.message}")
        }
    }

    /**
     * Helper function to parse ISO 8601 date string to Date object
     */
    private fun parseDate(dateString: String?): Date {
        return dateString?.let {
            try {
                val instant = java.time.Instant.parse(it)
                Date(instant.toEpochMilli())
            } catch (e: Exception) {
                Date()
            }
        } ?: Date()
    }

    /**
     * Get all pending sync operations
     */
    suspend fun getPendingOperations(): List<SyncQueue> {
        return database.syncQueueDao().getPendingSyncItems()
    }

    /**
     * Check if there are any pending operations
     */
    suspend fun hasPendingOperations(): Boolean {
        return database.syncQueueDao().getPendingSyncItems().isNotEmpty()
    }
}
