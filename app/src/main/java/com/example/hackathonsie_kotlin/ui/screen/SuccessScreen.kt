package com.example.hackathonsie_kotlin.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hackathonsie_kotlin.data.sync.SyncState

@Composable
fun SuccessScreen(
    onNavigateToHome: () -> Unit,
    syncState: SyncState = SyncState.Idle
) {
    Scaffold { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Success!",
                fontSize = 32.sp,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            Text(
                text = "You have successfully logged in",
                fontSize = 16.sp,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            // Show sync status
            when (syncState) {
                SyncState.Idle -> {
                    // No sync info needed
                }
                SyncState.Syncing -> {
                    CircularProgressIndicator(
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    Text(
                        text = "Syncing your data...",
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 24.dp)
                    )
                }
                is SyncState.Success -> {
                    Text(
                        text = syncState.message,
                        fontSize = 14.sp,
                        color = Color.Green,
                        modifier = Modifier.padding(bottom = 24.dp)
                    )
                }
                is SyncState.Error -> {
                    Text(
                        text = "Sync failed: ${syncState.exception.message}",
                        fontSize = 14.sp,
                        color = Color.Red,
                        modifier = Modifier.padding(bottom = 24.dp)
                    )
                }
            }

            Button(
                onClick = onNavigateToHome,
                modifier = Modifier.padding(top = 24.dp)
            ) {
                Text("Back to Home")
            }
        }
    }
}
