import { AndroidFile } from '../types';

export const androidProjectFiles: AndroidFile[] = [
  {
    name: "build.gradle.kts",
    path: "app/build.gradle.kts",
    language: "groovy",
    description: "App-level Build configuration setting up Jetpack Compose, Room Database, Retrofit, Hilt, and Android lifecycle dependencies.",
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
    alias(libs.plugins.hilt.android)
}

android {
    namespace = "com.ai.richa"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ai.richa"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX Core & Lifecycle
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    // Jetpack Compose Complete Setup
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.activity.compose)

    // Dagger Hilt for Dependency Injection
    implementation(libs.hilt.android)
    kapt(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Room Persistent Storage SQLite Framework
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    kapt(libs.androidx.room.compiler)

    // Retrofit & OkHttp Networking Client
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging)

    // Speech & Text Audio Services
    implementation("androidx.lifecycle:lifecycle-service:2.8.2")

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}`
  },
  {
    name: "AndroidManifest.xml",
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    description: "Android system manifest declaring required hardware permissions (Microphone/Audio recording) and the persistent continuous execution Foreground Voice Service.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.ai.richa">

    <!-- Permissions required for RICHA Voice Companion -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".RichaApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Richa"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.Richa">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Foreground Service for Continuous Ambient Voice Duplex Interaction -->
        <service
            android:name=".service.VoiceService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

    </application>
</manifest>`
  },
  {
    name: "RichaDatabase.kt",
    path: "app/src/main/java/com/ai/richa/data/local/RichaDatabase.kt",
    language: "kotlin",
    description: "Database definitions and entity schemas for long-term memory records, conversation history, and mood and relationship progression tracking.",
    content: `package com.ai.richa.data.local

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
}`
  },
  {
    name: "RichaApiService.kt",
    path: "app/src/main/java/com/ai/richa/data/remote/RichaApiService.kt",
    language: "kotlin",
    description: "Retrofit client API schema proxying chat message buffers to the proxy handler endpoints running on the cloud servers.",
    content: `package com.ai.richa.data.remote

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
}`
  },
  {
    name: "VoiceService.kt",
    path: "app/src/main/java/com/ai/richa/service/VoiceService.kt",
    language: "kotlin",
    description: "Persistent Android Foreground Service handling low-latency continuous speech recognition engine and sequential Human Touch Text-To-Speech playback in dynamic background mode.",
    content: `package com.ai.richa.service

import android.app.*
import android.content.Intent
import android.os.*
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import com.ai.richa.R
import com.ai.richa.data.local.*
import com.ai.richa.data.remote.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

@AndroidEntryPoint
class VoiceService : LifecycleService(), TextToSpeech.OnInitListener {

    @Inject lateinit var chatDao: ChatDao
    @Inject lateinit var memoryDao: MemoryDao
    @Inject lateinit var statsDao: StatsDao
    @Inject lateinit var apiService: RichaApiService

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    
    private var isTtsReady = false
    private var isListening = false
    private var isSpeaking = false

    private val _serviceState = MutableStateFlow<VoiceState>(VoiceState.Idle)
    val serviceState = _serviceState.asStateFlow()

    sealed class VoiceState {
        object Idle : VoiceState()
        object Listening : VoiceState()
        object Processing : VoiceState()
        class Speaking(val value: String) : VoiceState()
    }

    override fun onCreate() {
        super.onCreate()
        initTTS()
        initSpeechRecognizer()
        startServiceForeground()
    }

    private fun startServiceForeground() {
        val channelId = "richa_voice_channel"
        val channelName = "Richa Ambient Conversation Service"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(chan)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Richa is listening")
            .setContentText("Continuous voice session is active...")
            .setSmallIcon(android.R.drawable.presence_audio_online)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(101, notification)
    }

    private fun initTTS() {
        tts = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("hi", "IN")) // Hindi context support
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.ENGLISH)
            }
            
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    isSpeaking = true
                    _serviceState.value = VoiceState.Speaking("Richa is speaking...")
                }

                override fun onDone(utteranceId: String?) {
                    isSpeaking = false
                    _serviceState.value = VoiceState.Idle
                    // Speech finished, resume continuous duplex listening
                    Handler(Looper.getMainLooper()).post {
                        startListening()
                    }
                }

                override fun onError(utteranceId: String?) {
                    isSpeaking = false
                    _serviceState.value = VoiceState.Idle
                }
            })
            isTtsReady = true
        }
    }

    private fun initSpeechRecognizer() {
        Handler(Looper.getMainLooper()).post {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    isListening = true
                    _serviceState.value = VoiceState.Listening
                }

                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {
                    // Feed live amplitude to layout rendering (visualize waveform spikes)
                }
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}

                override fun onError(error: Int) {
                    isListening = false
                    _serviceState.value = VoiceState.Idle
                    // Handle timeouts and silence: automatically retry listening in loop
                    if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                        startListening()
                    }
                }

                override fun onResults(results: Bundle?) {
                    isListening = false
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val inputSentence = matches[0]
                        processSpeechInput(inputSentence)
                    } else {
                        startListening()
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    fun startListening() {
        if (isSpeaking) return // Avoid self-speech loopback trigger
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN") // Handles English + Hindi mix naturally
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        
        Handler(Looper.getMainLooper()).post {
            speechRecognizer?.startListening(intent)
        }
    }

    private fun processSpeechInput(userInput: String) {
        _serviceState.value = VoiceState.Processing
        
        lifecycleScope.launch {
            try {
                // 1. Commit user input to Sqlite database
                chatDao.insertMessage(ChatMessageEntity(sender = "user", text = userInput))
                
                // 2. Fetch context variables
                val stats = statsDao.getUserStats() ?: UserStatsEntity()
                val memories = memoryDao.getAllMemories().map { it.fact }
                
                // Formulate request
                val req = ChatRequest(
                    message = userInput,
                    history = listOf(), // VM mapping normally packs historic turns here
                    longTermMemory = LongTermMemoryContext(
                        hobbies = stats.coreHobbies,
                        goals = stats.primaryGoals,
                        memories = memories
                    ),
                    userName = stats.userName
                )
                
                // 3. Request reply from full-stack Richa companion endpoint
                val apiRes = apiService.getRichaResponse(req)
                if (apiRes.success && apiRes.data != null) {
                    val richaData = apiRes.data
                    
                    // Respond with TTS Voice audio playback
                    speakOut(richaData.reply)
                    
                    // Commit Richa response to DB
                    chatDao.insertMessage(ChatMessageEntity(
                        sender = "richa", 
                        text = richaData.reply,
                        mood = richaData.detectedMood
                    ))
                    
                    // Save extracted new long term memory elements from conversation
                    richaData.memoryExtracts.forEach { memFact ->
                        if (memFact.isNotBlank()) {
                            memoryDao.insertMemory(LongTermMemoryEntity(fact = memFact))
                        }
                    }
                    
                    // Update relationship levels
                    if (richaData.relationshipPoints > 0) {
                        val updatedStats = stats.copy(
                            relationshipPoints = stats.relationshipPoints + richaData.relationshipPoints,
                            relationshipLevel = if (stats.relationshipPoints + richaData.relationshipPoints > stats.relationshipLevel * 10) 
                                stats.relationshipLevel + 1 
                            else stats.relationshipLevel,
                            lastActive = System.currentTimeMillis()
                        )
                        statsDao.saveUserStats(updatedStats)
                    }
                    
                } else {
                    speakOut("Arre yaara, network issues thode ho gaye hain. Kuch pal baad bolna?")
                }
            } catch (e: Exception) {
                Log.e("VoiceService", "Error communicating with RICHA API Server", e)
                speakOut("Sorry yaara, mujhe connect karne mein problem ho rahi hai.")
            }
        }
    }

    private fun speakOut(text: String) {
        if (!isTtsReady) return
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "richa_utterance_msg")
    }

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        tts?.shutdown()
    }

    override fun onBind(intent: Intent): IBinder? {
        super.onBind(intent)
        return VoiceBinder()
    }

    inner class VoiceBinder : Binder() {
        fun getService(): VoiceService = this@VoiceService
    }
}`
  },
  {
    name: "RichaVoiceScreen.kt",
    path: "app/src/main/java/com/ai/richa/ui/screen/RichaVoiceScreen.kt",
    language: "kotlin",
    description: "Visually stunning dynamic UI in Jetpack Compose featuring an organic pulsing fluid dynamic avatar gradient, reactive volume waveform, breathing rings, and high-fidelity glows.",
    content: `package com.ai.richa.ui.screen

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.sin

@Composable
fun RichaVoiceScreen(
    currentStatus: String = "Listening...", // "Listening", "Speaking", "Thinking", or "Idle"
    userName: String = "Shivam",
    onBackPressed: () -> Unit = {}
) {
    // Elegant pure black and bottom-glowing theme setup
    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF000000), // Pure Black Main Dark Body
            Color(0xFF050B1B), // Soft deep cosmic navy
            Color(0xFF0F1E44), // Vibrant Indigo Bottom Glow Base
        )
    )

    // Breathing Animation values
    val infiniteTransition = rememberInfiniteTransition(label = "breathe")
    val breatheScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "scaling"
    )

    val innerBreatheAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "alpha"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        // Floating Top Header Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "RICHA AI",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .clickable { onBackPressed() }
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text("Chat Mode", color = Color(0xFF6AA7FF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Center Content - Fluid Breathing Companion Avatar and waveforms
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            
            // Halo breathing circle rings around avatar
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(260.dp)
                    .graphicsLayer {
                        scaleX = breatheScale
                        scaleY = breatheScale
                    }
            ) {
                // Glow Ring 1
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color(0xFF3B82F6).copy(alpha = 0.15f), Color.Transparent),
                            radius = size.minDimension / 1.5f
                        )
                    )
                }

                // Breathing stroke outline Ring 2
                Canvas(modifier = Modifier.size(210.dp)) {
                    drawCircle(
                        color = Color(0xFF4F46E5).copy(alpha = innerBreatheAlpha * 0.4f),
                        style = Stroke(width = 2.dp)
                    )
                }

                // Central Fluid Core Avatar representing Richa
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    Color(0xFF2563EB), // Sleek Royal Blue
                                    Color(0xFF4F46E5), // Indigo Glow Core
                                    Color(0xFFEC4899)  // Playful Ruby Pink Accent
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "R",
                        color = Color.White,
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Light,
                        letterSpacing = (-2).sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(30.dp))

            // Subtitle state feedback
            Text(
                text = "What's next, $userName?",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = currentStatus.uppercase(),
                color = when (currentStatus) {
                    "Listening..." -> Color(0xFF10B981) // High-visibility Emerald
                    "Speaking..." -> Color(0xFF6366F1) // Electric Violet
                    "Thinking..." -> Color(0xFFF59E0B) // Amber Golden glow
                    else -> Color.White.copy(alpha = 0.5f)
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(40.dp))

            // Waveform Amplitude visualizer widget
            VoiceEqualizerWaveform(
                isActive = (currentStatus == "Listening..." || currentStatus == "Speaking..."),
                amplitudeFactor = if (currentStatus == "Speaking...") 2.8f else 1.2f
            )
        }

        // Bottom control pills
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 40.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(32.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .padding(horizontal = 24.dp, vertical = 14.dp)
            ) {
                Text(
                    text = if(currentStatus == "Listening...") "Speak anytime, I'm listening" else "Tap wave to pause",
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
fun VoiceEqualizerWaveform(isActive: Boolean, amplitudeFactor: Float) {
    val infiniteTransition = rememberInfiniteTransition(label = "waveform")
    val waveOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ), label = "phaseShift"
    )

    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
            .padding(horizontal = 40.dp)
    ) {
        val width = size.width
        val height = size.height
        val centerY = height / 2f
        val pointsCount = 40
        val step = width / pointsCount

        val brush = Brush.linearGradient(
            colors = listOf(Color(0xFF3B82F6), Color(0xFF6366F1), Color(0xFFEC4899))
        )

        for (i in 0 until pointsCount) {
            val x = i * step
            // Modulate scale amplitude based on proximity to center for organic look
            val normalizedX = i.toFloat() / pointsCount
            val centerConstraint = sin(normalizedX * Math.PI).toFloat()
            
            val amplitude = if (isActive) {
                (sin((normalizedX * 4f * Math.PI) + waveOffset).toFloat() * 18.dp.toPx() * centerConstraint * amplitudeFactor)
            } else {
                sin(normalizedX * Math.PI).toFloat() * 2.dp.toPx()
            }

            drawLine(
                brush = brush,
                start = androidx.compose.ui.geometry.Offset(x, centerY - amplitude),
                end = androidx.compose.ui.geometry.Offset(x, centerY + amplitude),
                strokeWidth = 3.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
        }
    }
}`
  },
  {
    name: "RichaViewModel.kt",
    path: "app/src/main/java/com/ai/richa/ui/viewmodel/RichaViewModel.kt",
    language: "kotlin",
    description: "Android MVVM pattern coordinator tracking and exposing state flows of memories, stats, message loops, and API responses.",
    content: `package com.ai.richa.ui.viewmodel

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
}`
  },
  {
    name: "MainActivity.kt",
    path: "app/src/main/java/com/ai/richa/MainActivity.kt",
    language: "kotlin",
    description: "The primary entry-point Activity of the Android application, which sets the Jetpack Compose content view to RichaVoiceScreen with full Hilt Entry Point dependency injection.",
    content: `package com.ai.richa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.ai.richa.ui.screen.RichaVoiceScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            RichaVoiceScreen()
        }
    }
}`
  },
  {
    name: "RichaApplication.kt",
    path: "app/src/main/java/com/ai/richa/RichaApplication.kt",
    language: "kotlin",
    description: "Deep Android Application root class annotated with HiltAndroidApp to generate compile-time dependency injection grails.",
    content: `package com.ai.richa

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class RichaApplication : Application()`
  }
];
