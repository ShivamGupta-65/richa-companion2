package com.ai.richa.service

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
}
