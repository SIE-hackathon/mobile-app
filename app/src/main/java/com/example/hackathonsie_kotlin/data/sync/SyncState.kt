package com.example.hackathonsie_kotlin.data.sync

sealed class SyncState {
    object Idle : SyncState()
    object Syncing : SyncState()
    data class Success(val message: String = "Sync completed successfully") : SyncState()
    data class Error(val exception: Exception) : SyncState()
}
