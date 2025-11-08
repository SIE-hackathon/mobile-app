package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

/**
 * AppSettings - Store app configuration
 * Key-value store for app settings
 * 
 * Common Keys:
 * - last_sync_timestamp
 * - offline_mode_enabled
 * - e2ee_enabled
 * - current_user_id
 */
@Entity(tableName = "app_settings")
data class AppSettings(
    @PrimaryKey
    val key: String,
    
    @ColumnInfo(name = "value")
    val value: String,
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Date
)
