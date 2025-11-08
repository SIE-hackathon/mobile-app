package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.hackathonsie_kotlin.data.local.entity.AuthToken

/**
 * DAO for AuthToken operations
 * Manages authentication token storage
 */
@Dao
interface AuthTokenDao {
    
    @Query("SELECT * FROM auth_tokens WHERE id = 1")
    suspend fun getToken(): AuthToken?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveToken(token: AuthToken)
    
    @Query("DELETE FROM auth_tokens")
    suspend fun clearToken()
    
    @Query("SELECT EXISTS(SELECT 1 FROM auth_tokens WHERE id = 1)")
    suspend fun hasToken(): Boolean
}
