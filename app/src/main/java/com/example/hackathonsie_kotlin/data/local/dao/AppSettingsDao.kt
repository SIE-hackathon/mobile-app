package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.hackathonsie_kotlin.data.local.entity.AppSettings
import kotlinx.coroutines.flow.Flow

/**
 * DAO for AppSettings operations
 * Manages app configuration key-value pairs
 */
@Dao
interface AppSettingsDao {
    
    @Query("SELECT * FROM app_settings WHERE key = :key")
    suspend fun getSetting(key: String): AppSettings?
    
    @Query("SELECT * FROM app_settings WHERE key = :key")
    fun getSettingFlow(key: String): Flow<AppSettings?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSetting(setting: AppSettings)
    
    @Query("SELECT value FROM app_settings WHERE key = :key")
    suspend fun getValue(key: String): String?
    
    @Query("DELETE FROM app_settings WHERE key = :key")
    suspend fun deleteSetting(key: String)
    
    @Query("DELETE FROM app_settings")
    suspend fun clearAllSettings()
    
    @Query("SELECT * FROM app_settings")
    fun getAllSettings(): Flow<List<AppSettings>>
}
