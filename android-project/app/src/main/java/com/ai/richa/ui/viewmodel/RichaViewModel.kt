package com.ai.richa.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ai.richa.data.local.*
import com.ai.richa.data.remote.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RichaViewModel @Inject constructor(
    private val chatDao: ChatDao,
    private val memoryDao: MemoryDao,
    private val statsDao: StatsDao,
    private val apiService: RichaApiService
) : ViewModel() {

    // Expose histories
    val chatHistory: StateFlow<List<ChatMessageEntity>> = chatDao.getRecentHistory()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Expose long term memory updates
    val longTermMemories: StateFlow<List<LongTermMemoryEntity>> = memoryDao.getAllMemoriesFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Expose relationship and stats indicators
    val userStats: StateFlow<UserStatsEntity?> = statsDao.getUserStatsFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing = _isProcessing.asStateFlow()

    fun sendMessage(inputText: String) {
        if (inputText.isBlank()) return

        viewModelScope.launch {
            // Commit user speech turn
            chatDao.insertMessage(ChatMessageEntity(sender = "user", text = inputText))
            _isProcessing.value = true

            try {
                // Prepare historic contexts mapping
                val currentHist = chatHistory.value.takeLast(10).map {
                    RequestMessage(
                        role = if (it.sender == "user") "user" else "assistant",
                        text = it.text,
                        mood = it.mood
                    )
                }

                val stats = statsDao.getUserStats() ?: UserStatsEntity()
                val savedMemories = memoryDao.getAllMemories().map { it.fact }

                val request = ChatRequest(
                    message = inputText,
                    history = currentHist,
                    longTermMemory = LongTermMemoryContext(
                        hobbies = stats.coreHobbies,
                        goals = stats.primaryGoals,
                        memories = savedMemories
                    ),
                    userName = stats.userName
                )

                val response = apiService.getRichaResponse(request)
                if (response.success && response.data != null) {
                    val out = response.data
                    
                    // Commit rich companion reply turn
                    chatDao.insertMessage(ChatMessageEntity(
                        sender = "richa",
                        text = out.reply,
                        mood = out.detectedMood
                    ))

                    // Insert newly committed long term memories
                    out.memoryExtracts.forEach { fact ->
                        if (fact.isNotBlank()) {
                            memoryDao.insertMemory(LongTermMemoryEntity(fact = fact))
                        }
                    }

                    // Progress Relationship Level Rating
                    if (out.relationshipPoints > 0) {
                        val currentPoints = stats.relationshipPoints + out.relationshipPoints
                        val nextLevelBound = stats.relationshipLevel * 10
                        val newLevel = if (currentPoints >= nextLevelBound) stats.relationshipLevel + 1 else stats.relationshipLevel
                        
                        statsDao.saveUserStats(stats.copy(
                            relationshipPoints = currentPoints,
                            relationshipLevel = newLevel,
                            lastActive = System.currentTimeMillis()
                        ))
                    }
                }
            } catch (e: Exception) {
                chatDao.insertMessage(ChatMessageEntity(
                    sender = "richa",
                    text = "Arre Shivam! Thoda network ka panga lag rha h yar. Dobara try karein?"
                ))
            } finally {
                _isProcessing.value = false
            }
        }
    }

    fun modifyProfile(newName: String, newHobbies: String, newGoals: String) {
        viewModelScope.launch {
            val current = statsDao.getUserStats() ?: UserStatsEntity()
            statsDao.saveUserStats(current.copy(
                userName = newName,
                coreHobbies = newHobbies,
                primaryGoals = newGoals
            ))
        }
    }

    fun clearAllConvos() {
        viewModelScope.launch {
            chatDao.clearHistory()
        }
    }
}
