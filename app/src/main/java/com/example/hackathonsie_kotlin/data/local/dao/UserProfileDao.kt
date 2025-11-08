package com.example.hackathonsie_kotlin.data.local.dao

import androidx.room.*
import com.example.hackathonsie_kotlin.data.local.entity.UserProfile
import kotlinx.coroutines.flow.Flow

/**
 * DAO for User Profile operations
 */
@Dao
interface UserProfileDao {
    
    @Query("SELECT * FROM user_profiles WHERE id = :userId")
    suspend fun getUserProfile(userId: String): UserProfile?
    
    @Query("SELECT * FROM user_profiles WHERE id = :userId")
    fun getUserProfileFlow(userId: String): Flow<UserProfile?>
    
    @Query("SELECT * FROM user_profiles")
    fun getAllUserProfiles(): Flow<List<UserProfile>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserProfile(userProfile: UserProfile)
    
    @Update
    suspend fun updateUserProfile(userProfile: UserProfile)
    
    @Delete
    suspend fun deleteUserProfile(userProfile: UserProfile)
    
    @Query("SELECT * FROM user_profiles WHERE display_name LIKE '%' || :query || '%'")
    fun searchUserProfiles(query: String): Flow<List<UserProfile>>
}
