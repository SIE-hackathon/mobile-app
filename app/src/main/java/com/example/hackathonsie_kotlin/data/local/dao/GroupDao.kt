package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.Group
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Group operations
 */
@Dao
interface GroupDao {
    
    @Query("SELECT * FROM groups WHERE id = :groupId")
    suspend fun getGroup(groupId: String): Group?
    
    @Query("SELECT * FROM groups WHERE id = :groupId")
    fun getGroupFlow(groupId: String): Flow<Group?>
    
    @Query("SELECT * FROM groups")
    fun getAllGroups(): Flow<List<Group>>
    
    @Query("SELECT * FROM groups WHERE owner_id = :userId")
    fun getGroupsByOwner(userId: String): Flow<List<Group>>
    
    @Query("SELECT * FROM groups WHERE parent_group_id = :parentId")
    fun getSubGroups(parentId: String): Flow<List<Group>>
    
    @Query("SELECT * FROM groups WHERE parent_group_id IS NULL")
    fun getRootGroups(): Flow<List<Group>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroup(group: Group)
    
    @Update
    suspend fun updateGroup(group: Group)
    
    @Delete
    suspend fun deleteGroup(group: Group)
    
    @Query("SELECT * FROM groups WHERE name LIKE '%' || :query || '%'")
    fun searchGroups(query: String): Flow<List<Group>>
}
