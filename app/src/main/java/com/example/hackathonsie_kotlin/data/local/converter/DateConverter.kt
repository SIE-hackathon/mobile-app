package com.example.hackathonsie_kotlin.data.local.converter

import androidx.room.TypeConverter
import java.util.Date

/**
 * Type converter for Date objects
 * Required by Room to store Date fields in SQLite
 */
class DateConverter {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }
}
