package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Group Members - Link users to groups with roles
 * Enforces unique membership per user per group
 */
@Entity(
    tableName = "group_members",
    foreignKeys = [
        ForeignKey(
            entity = Group::class,
            parentColumns = ["id"],
            childColumns = ["group_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["user_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["id"], unique = true),
        Index(value = ["group_id", "user_id"], unique = true), // Prevent duplicate memberships
        Index(value = ["group_id"]),
        Index(value = ["user_id"]),
        Index(value = ["role"])
    ]
)
data class GroupMember(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "group_id")
    val groupId: String,
    
    @ColumnInfo(name = "user_id")
    val userId: String,
    
    @ColumnInfo(name = "role")
    val role: MemberRole,
    
    @ColumnInfo(name = "joined_at")
    val joinedAt: Date
)

enum class MemberRole {
    OWNER,
    ADMIN,
    MEMBER
}
