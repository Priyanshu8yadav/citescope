package com.citescope.ai

import android.app.Application
import androidx.room.Room
import com.citescope.ai.data.local.CiteScopeDatabase

class CiteScopeApplication : Application() {

    lateinit var database: CiteScopeDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        database = Room.databaseBuilder(
            applicationContext,
            CiteScopeDatabase::class.java,
            "citescope_database"
        ).fallbackToDestructiveMigration().build()
    }
}
