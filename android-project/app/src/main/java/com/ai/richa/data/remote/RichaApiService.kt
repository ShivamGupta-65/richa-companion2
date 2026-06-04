package com.ai.richa.data.remote

import retrofit2.http.Body
import retrofit2.http.POST

// API Request Parameters
data class ChatRequest(
    val message: String,
    val history: List<RequestMessage>,
    val longTermMemory: LongTermMemoryContext,
    val userName: String = "Shivam"
)

data class RequestMessage(
    val role: String, // "user" or "assistant"
    val text: String,
    val mood: String? = null
)

data class LongTermMemoryContext(
    val hobbies: String,
    val goals: String,
    val memories: List<String>
)

// API Response model mapping Richa's structured response
data class ChatResponse(
    val success: Boolean,
    val data: RichaOutput?
)

data class RichaOutput(
    val reply: String,
    val detectedMood: String,
    val memoryExtracts: List<String>,
    val relationshipPoints: Int
)

interface RichaApiService {
    @POST("api/chat")
    suspend fun getRichaResponse(@Body request: ChatRequest): ChatResponse
}
