package com.citescope.ai.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "saved_papers")
data class Paper(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("year")
    val year: Int = 2024,
    
    @SerializedName("venue")
    val venue: String = "Academic Repository",
    
    @SerializedName("citation_count")
    val citationCount: Int = 0,
    
    @SerializedName("tldr")
    val tldr: String = "",
    
    @SerializedName("abstract")
    val abstractText: String = "",
    
    @SerializedName("pdf_url")
    val pdfUrl: String? = null,
    
    val isOfflineCached: Boolean = false,
    val localPdfPath: String? = null,
    val userNotes: String? = null
)

data class ConsensusResponse(
    val query: String,
    val stance: ConsensusStance,
    val synthesis: String
)

data class ConsensusStance(
    val affirmative: Int,
    @SerializedName("neutral_or_mixed")
    val neutralOrMixed: Int,
    @SerializedName("negative_or_disputing")
    val negativeOrDisputing: Int
)
