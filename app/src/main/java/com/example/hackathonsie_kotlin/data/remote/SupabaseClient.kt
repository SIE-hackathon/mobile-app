package com.example.hackathonsie_kotlin.data.remote

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

/**
 * Supabase client singleton
 * Provides access to Supabase services (Postgrest, Auth, Realtime)
 */
object SupabaseClient {
    
    private const val SUPABASE_URL = "https://supabase.notiustin.com"
    private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYyNTUyODAwLCJleHAiOjE5MjAzMTkyMDB9.h4N9HhXpcpm_xZYdMWyumV8QWkXJZSALsI6I74GabYo"
    
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = SUPABASE_URL,
            supabaseKey = SUPABASE_KEY
        ) {
            install(Postgrest)
            install(Auth)
            install(Realtime)
        }
    }
}
