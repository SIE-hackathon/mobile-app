package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * User Profiles - Extends auth.users with additional data
 * Stores display name, public key for E2EE, and avatar
 */
@Entity(
    tableName = "user_profiles",
    indices = [Index(value = ["id"], unique = true)]
)
data class UserProfile(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "display_name")
    val displayName: String,
    
    @ColumnInfo(name = "avatar_url")
    val avatarUrl: String? = null,
    
    @ColumnInfo(name = "public_key")
    val publicKey: String, // For E2EE
    
    @ColumnInfo(name = "created_at")
    val createdAt: Date,
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Date
)
