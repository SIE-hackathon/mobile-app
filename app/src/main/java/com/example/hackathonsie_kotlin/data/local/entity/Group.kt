package com.example.hackathonsie_kotlin.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Groups - Organize users into teams/groups
 * Supports hierarchical structure with parent_group_id
 */
@Entity(
    tableName = "groups",
    foreignKeys = [
        ForeignKey(
            entity = UserProfile::class,
            parentColumns = ["id"],
            childColumns = ["owner_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Group::class,
            parentColumns = ["id"],
            childColumns = ["parent_group_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["id"], unique = true),
        Index(value = ["owner_id"]),
        Index(value = ["parent_group_id"])
    ]
)
data class Group(
    @PrimaryKey
    val id: String, // UUID as String
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "description")
    val description: String? = null,
    
    @ColumnInfo(name = "owner_id")
    val ownerId: String,
    
    @ColumnInfo(name = "parent_group_id")
    val parentGroupId: String? = null,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Date,
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Date
)
