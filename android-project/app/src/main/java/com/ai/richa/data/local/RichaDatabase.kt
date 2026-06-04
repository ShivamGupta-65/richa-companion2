package com.ai.richa.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// 1. Long Term memories Entity
@Entity(tableName = "long_term_memories")
data class LongTermMemoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val fact: String,
    val category: String = "general",
    val timestamp: Long = System.currentTimeMillis()
)

// 2. Chat history logs Entity
@Entity(tableName = "chat_history")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sender: String, // "user" or "richa"
    val text: String,
    val mood: String = "Neutral",
    val timestamp: Long = System.currentTimeMillis()
)

// 3. User relationship and statistics Entity
@Entity(tableName = "user_profile_stats")
data class UserStatsEntity(
    @PrimaryKey val id: Int = 1,
    val userName: String = "Shivam",
    val relationshipLevel: Int = 1,
    val relationshipPoints: Int = 0,
    val lastActive: Long = System.currentTimeMillis(),
    val totalSessionsCount: Int = 1,
    val primaryGoals: String = "Getting healthy/workout, Android mobile development",
    val coreHobbies: String = "Coding, listening to retro beats, exploring AI technology"
)

// Room Database DAOs
@Dao
interface MemoryDao {
    @Query("SELECT * FROM long_term_memories ORDER BY timestamp DESC")
    fun getAllMemoriesFlow(): Flow<List<LongTermMemoryEntity>>

    @Query("SELECT * FROM long_term_memories ORDER BY timestamp DESC")
    suspend fun getAllMemories(): List<LongTermMemoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMemory(memory: LongTermMemoryEntity)

    @Query("DELETE FROM long_term_memories WHERE id = :id")
    suspend fun deleteMemory(id: Long)
}

@Dao
interface ChatDao {
    @Query("SELECT * FROM chat_history ORDER BY timestamp ASC LIMIT 200")
    fun getRecentHistory(): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: ChatMessageEntity)

    @Query("DELETE FROM chat_history")
    suspend fun clearHistory()
}

@Dao
interface StatsDao {
    @Query("SELECT * FROM user_profile_stats WHERE id = 1")
    fun getUserStatsFlow(): Flow<UserStatsEntity?>

    @Query("SELECT * FROM user_profile_stats WHERE id = 1")
    suspend fun getUserStats(): UserStatsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveUserStats(stats: UserStatsEntity)
}

@Database(
    entities = [LongTermMemoryEntity::class, ChatMessageEntity::class, UserStatsEntity::class],
    version = 1,
    exportSchema = false
)
abstract class RichaDatabase : RoomDatabase() {
    abstract fun memoryDao(): MemoryDao
    abstract fun chatDao(): ChatDao
    abstract fun statsDao(): StatsDao
}
