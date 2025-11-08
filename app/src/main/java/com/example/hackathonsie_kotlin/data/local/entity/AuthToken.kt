package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

/**
 * AuthToken - Store authentication tokens locally
 * Single row table (id always = 1)
 */
@Entity(tableName = "auth_tokens")
data class AuthToken(
    @PrimaryKey
    val id: Int = 1, // Always 1, single row
    
    @ColumnInfo(name = "access_token")
    val accessToken: String,
    
    @ColumnInfo(name = "refresh_token")
    val refreshToken: String?,
    
    @ColumnInfo(name = "user_id")
    val userId: String,
    
    @ColumnInfo(name = "expires_at")
    val expiresAt: Date,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Date
) {
    fun isExpired(): Boolean = Date().after(expiresAt)
}
