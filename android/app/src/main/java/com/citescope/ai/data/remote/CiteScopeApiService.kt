package com.citescope.ai.data.remote

import com.citescope.ai.data.model.ConsensusResponse
import com.citescope.ai.data.model.Paper
import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

data class SearchResponse(
    val query: String,
    val count: Int,
    val consensus: ConsensusResponse,
    val papers: List<Paper>
)

interface CiteScopeApiService {
    @GET("api/search")
    suspend fun searchPapers(
        @Query("q") query: String
    ): SearchResponse

    @GET("api/consensus")
    suspend fun getConsensus(
        @Query("q") query: String
    ): ConsensusResponse

    companion object {
        // Points to local dev machine via 10.0.2.2 (Android Emulator loopback) or localhost
        private const val BASE_URL = "http://10.0.2.2:8000/"

        fun create(): CiteScopeApiService {
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(CiteScopeApiService::class.java)
        }
    }
}
