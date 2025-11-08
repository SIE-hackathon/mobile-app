package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.GroupMember
import com.example.hackathonsie_kotlin.data.local.entity.MemberRole
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Group Member operations
 */
@Dao
interface GroupMemberDao {
    
    @Query("SELECT * FROM group_members WHERE id = :memberId")
    suspend fun getGroupMember(memberId: String): GroupMember?
    
    @Query("SELECT * FROM group_members WHERE group_id = :groupId")
    fun getGroupMembers(groupId: String): Flow<List<GroupMember>>
    
    @Query("SELECT * FROM group_members WHERE user_id = :userId")
    fun getUserMemberships(userId: String): Flow<List<GroupMember>>
    
    @Query("SELECT * FROM group_members WHERE group_id = :groupId AND role = :role")
    fun getMembersByRole(groupId: String, role: MemberRole): Flow<List<GroupMember>>
    
    @Query("SELECT * FROM group_members WHERE group_id = :groupId AND user_id = :userId")
    suspend fun getMembershipByGroupAndUser(groupId: String, userId: String): GroupMember?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroupMember(groupMember: GroupMember)
    
    @Update
    suspend fun updateGroupMember(groupMember: GroupMember)
    
    @Delete
    suspend fun deleteGroupMember(groupMember: GroupMember)
    
    @Query("DELETE FROM group_members WHERE group_id = :groupId AND user_id = :userId")
    suspend fun removeMember(groupId: String, userId: String)
}
