package com.citescope.ai.data.local

import androidx.room.*
import com.citescope.ai.data.model.Paper
import kotlinx.coroutines.flow.Flow

@Dao
interface PaperDao {
    @Query("SELECT * FROM saved_papers ORDER BY year DESC")
    fun getAllSavedPapers(): Flow<List<Paper>>

    @Query("SELECT * FROM saved_papers WHERE id = :paperId LIMIT 1")
    suspend fun getPaperById(paperId: String): Paper?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPaper(paper: Paper)

    @Delete
    suspend fun deletePaper(paper: Paper)

    @Query("UPDATE saved_papers SET userNotes = :notes WHERE id = :paperId")
    suspend fun updateNotes(paperId: String, notes: String)
}

@Database(entities = [Paper::class], version = 1, exportSchema = false)
abstract class CiteScopeDatabase : RoomDatabase() {
    abstract fun paperDao(): PaperDao
}
