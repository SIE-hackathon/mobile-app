package com.example.hackathonsie_kotlin.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.hackathonsie_kotlin.data.local.converter.DateConverter
import com.example.hackathonsie_kotlin.data.local.converter.EnumConverters
import com.example.hackathonsie_kotlin.data.local.dao.*
import com.example.hackathonsie_kotlin.data.local.entity.*

/**
 * Main Room database for the Task Management app
 * 
 * Database Schema includes:
 * - User Profiles (extends auth.users)
 * - Groups (team/group organization)
 * - Group Members (user-group linking)
 * - Tasks (core task management)
 * - Activity Logs (audit trail)
 * - Task Assignments (assignment tracking)
 * - Sync Queue (offline support)
 * - Auth Token (authentication token storage)
 * - App Settings (app configuration)
 */
@Database(
    entities = [
        UserProfile::class,
        Group::class,
        GroupMember::class,
        Task::class,
        ActivityLog::class,
        TaskAssignment::class,
        SyncQueue::class,
        AuthToken::class,
        AppSettings::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(DateConverter::class, EnumConverters::class)
abstract class AppDatabase : RoomDatabase() {
    
    // DAO access methods
    abstract fun userProfileDao(): UserProfileDao
    abstract fun groupDao(): GroupDao
    abstract fun groupMemberDao(): GroupMemberDao
    abstract fun taskDao(): TaskDao
    abstract fun activityLogDao(): ActivityLogDao
    abstract fun taskAssignmentDao(): TaskAssignmentDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun authTokenDao(): AuthTokenDao
    abstract fun appSettingsDao(): AppSettingsDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        private const val DATABASE_NAME = "task_management_db"
        
        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigration(dropAllTables = true) // For development only
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
