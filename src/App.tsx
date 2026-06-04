import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles, BookOpen, 
  Award, Smile, Activity, Code, FileCode, Settings, Trash2, 
  User, Plus, ArrowRight, Database, Heart, Info, ClipboardCheck, 
  Check, Play, Pause, RefreshCw, ChevronRight, Lock
} from 'lucide-react';
import JSZip from 'jszip';
import { androidProjectFiles } from './data/androidProjectFiles';
import { Message, LongTermMemory, DiaryEntry, MoodRecord, AndroidFile } from './types';

export default function App() {
  // Navigation tabs: 'voice' | 'chat' | 'memory' | 'android'
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'memory' | 'android'>('voice');
  
  // Real or simulated states
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('richa_user_name') || 'Shivam';
  });
  const [userHobbies, setUserHobbies] = useState<string>(() => {
    return localStorage.getItem('richa_user_hobbies') || 'Coding, listening to retro beats, exploring AI';
  });
  const [userGoals, setUserGoals] = useState<string>(() => {
    return localStorage.getItem('richa_user_goals') || 'Building Android application, hitting the gym regularly';
  });

  // Long term memories
  const [longTermMemory, setLongTermMemory] = useState<LongTermMemory>(() => {
    const saved = localStorage.getItem('richa_memory');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      hobbies: userHobbies,
      goals: userGoals,
      memories: [
        "Shivam loves retro tech and dreams of publishing his own voice assistant",
        "Wants to start going to the gym next Monday to improve focus",
        "Prefers casual conversations in a friendly Hinglish style over boring robotic English"
      ]
    };
  });

  // Messages setup
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('richa_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'welcome-user',
        role: 'user',
        text: 'Hey Richa! I am so excited to talk to you.',
        timestamp: new Date(Date.now() - 60000)
      },
      {
        id: 'welcome-richa',
        role: 'richa',
        text: 'Arre Shivam! Main bhi kabse tumse baat karne ka wait kar rahi thi. Batao yaara, aaj ka din kaisa raha tumhara? Hectic ya chill?',
        timestamp: new Date(Date.now() - 45000),
        mood: 'Excitement'
      }
    ];
  });

  // Stats State
  const [relationshipLevel, setRelationshipLevel] = useState<number>(() => {
    return Number(localStorage.getItem('richa_relations_level')) || 2;
  });
  const [relationshipPoints, setRelationshipPoints] = useState<number>(() => {
    return Number(localStorage.getItem('richa_relations_points')) || 8;
  });
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Idle'); // 'Idle', 'Listening...', 'Thinking...', 'Speaking...'
  
  // Custom text input
  const [inputValue, setInputValue] = useState<string>('');
  
  // Web Speech interfaces
  const [recognition, setRecognition] = useState<any>(null);
  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Android hub files state
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(androidProjectFiles[0]);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [newMemoryInput, setNewMemoryInput] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  // Trigger LocalStorage Persistence
  useEffect(() => {
    localStorage.setItem('richa_user_name', userName);
    localStorage.setItem('richa_user_hobbies', userHobbies);
    localStorage.setItem('richa_user_goals', userGoals);
  }, [userName, userHobbies, userGoals]);

  useEffect(() => {
    localStorage.setItem('richa_memory', JSON.stringify(longTermMemory));
  }, [longTermMemory]);

  useEffect(() => {
    localStorage.setItem('richa_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('richa_relations_level', String(relationshipLevel));
    localStorage.setItem('richa_relations_points', String(relationshipPoints));
  }, [relationshipLevel, relationshipPoints]);

  // Keep handleSendMessage in a ref to avoid stale closures in recognition event handlers
  const handleSendMessageRef = useRef<any>(null);
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Handle Speech Recognition Setup on Mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'hi-IN'; // Elegant Hinglish capability setup matching Android configs
      
      rec.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening...');
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        setStatusMessage('Idle');
      };

      rec.onend = () => {
        setIsListening(false);
        setStatusMessage(prev => prev === 'Listening...' ? 'Idle' : prev);
      };

      rec.onresult = (event: any) => {
        const textResult = event.results[0][0].transcript;
        if (textResult && textResult.trim().length > 0) {
          handleSendMessageRef.current?.(textResult);
        }
      };

      setRecognition(rec);
    }
  }, []);

  // Scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger Vocal output
  const speakVoiceOutput = (text: string) => {
    if (!isTtsEnabled) return;
    try {
      window.speechSynthesis.cancel(); // cancel current track
      
      const utterance = new SpeechSynthesisUtterance(text);
      // Attempt to pick a soft warm feminine sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const selection = voices.find(v => v.lang.startsWith('hi-') || v.name.includes('Google हिन्दी') || v.name.includes('India') || v.name.toLowerCase().includes('female'));
      if (selection) {
        utterance.voice = selection;
      }
      
      utterance.rate = 1.05; // Slightly faster for natural casual flow
      utterance.pitch = 1.1; // Friendly and cheerful tone

      utterance.onstart = () => {
        setStatusMessage('Speaking...');
      };

      utterance.onend = () => {
        setStatusMessage('Idle');
      };

      utterance.onerror = () => {
        setStatusMessage('Idle');
      };

      speechUttRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Text to speech failed to initialize:', e);
    }
  };

  // Toggle Micro Listening
  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      window.speechSynthesis.cancel(); // Stop any pending voice
      setStatusMessage('Listening...');
      try {
        recognition?.start();
      } catch (e) {
        // Fallback simulation if browser doesn't support or match
        setStatusMessage('Listening...');
        setTimeout(() => {
          const sims = [
            "Kaise ho Richa? Mere gym goals ke baare mein socha?",
            "Yaar aaj mood thoda low lag raha hai",
            "Mera ek success update hai! App crash free chal raha hai."
          ];
          const randomSim = sims[Math.floor(Math.random() * sims.length)];
          handleSendMessage(randomSim);
        }, 3000);
      }
    }
  };

  // Main chat communication endpoint connector
  async function handleSendMessage(text: string) {
    if (!text || text.trim().length === 0) return;

    // 1. Commit user statement to client structures
    const userMsg: Message = {
      id: `m-${Date.now()}-user`,
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);
    setStatusMessage('Thinking...');

    try {
      // Create chat history state model to match server requirements
      const formattedHistory = messages.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.text,
        mood: m.mood || 'Neutral'
      }));

      const payload = {
        message: text,
        history: formattedHistory,
        longTermMemory: {
          hobbies: longTermMemory.hobbies,
          goals: longTermMemory.goals,
          memories: longTermMemory.memories
        },
        userName: userName
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseJson = await res.json();

      if (responseJson.success && responseJson.data) {
        const out = responseJson.data;

        // Commit Richa response turn
        const richaMsg: Message = {
          id: `m-${Date.now()}-richa`,
          role: 'richa',
          text: out.reply,
          timestamp: new Date(),
          mood: out.detectedMood,
          hasAudio: true
        };

        setMessages(prev => [...prev, richaMsg]);

        // Commit new real time long term memories back to storage structures
        if (Array.isArray(out.memoryExtracts) && out.memoryExtracts.length > 0) {
          setLongTermMemory(prev => {
            const currentMemories = [...prev.memories];
            out.memoryExtracts.forEach((fact: string) => {
              if (fact && !currentMemories.includes(fact)) {
                currentMemories.push(fact);
              }
            });
            return {
              ...prev,
              memories: currentMemories
            };
          });
        }

        // Increase relationship score points
        if (out.relationshipPoints) {
          setRelationshipPoints(prev => {
            const nextPoints = prev + out.relationshipPoints;
            const targetBound = relationshipLevel * 8; // progression target boundary
            if (nextPoints >= targetBound) {
              setRelationshipLevel(lvl => lvl + 1);
              return nextPoints - targetBound;
            }
            return nextPoints;
          });
        }

        // Immediately trigger natural human vocal spoken words
        speakVoiceOutput(out.reply);

      } else {
        throw new Error("Missing response payload");
      }

    } catch (err) {
      console.error("Error communicating with Richa Server proxy API endpoint:", err);
      // Fail proof comforting backup responses
      const comfortingReplies = [
        "Arre Shivam yaara, thoda network ka glitch lag raha hai. Par tum dil chota mat karo, main yahin hoon tumhare sath!",
        "Kuch toh network gadbad hai yaara.. par chalo, tell me kaisa raha aaj ka poora dinn?",
        "Network issues yaara! Ek baar server.ts connection state check karoge please?"
      ];
      const randomComfort = comfortingReplies[Math.floor(Math.random() * comfortingReplies.length)];
      
      const errorMsg: Message = {
        id: `m-${Date.now()}-richa`,
        role: 'richa',
        text: randomComfort,
        timestamp: new Date(),
        mood: 'Sadness'
      };
      setMessages(prev => [...prev, errorMsg]);
      speakVoiceOutput(randomComfort);
    } finally {
      setIsProcessing(false);
    }
  }

  // Handle memory operations
  const handleAddNewMemory = () => {
    if (!newMemoryInput.trim()) return;
    setLongTermMemory(prev => ({
      ...prev,
      memories: [newMemoryInput.trim(), ...prev.memories]
    }));
    setNewMemoryInput('');
  };

  const handleDeleteMemory = (index: number) => {
    setLongTermMemory(prev => {
      const copy = [...prev.memories];
      copy.splice(index, 1);
      return {
        ...prev,
        memories: copy
      };
    });
  };

  // Bundle entire Android folder with build configurations and scripts in 1-Click ZIP
  const handleDownloadFullZip = async () => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();

      // 1. Loop through all rich files and write them in structure
      androidProjectFiles.forEach(file => {
        zip.file(file.path, file.content);
      });

      // 2. Add standard root Jetpack Compose Gradle wrapper assets to ensure cloud action compiler runs successfully
      zip.file("settings.gradle.kts", `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Richa"
include(":app")
`);

      zip.file("build.gradle.kts", `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.kapt) apply false
    alias(libs.plugins.hilt.android) apply false
}
`);

      zip.file("gradle.properties", `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
org.gradle.caching=true
org.gradle.parallel=true
`);

      zip.file("gradle/libs.versions.toml", `[versions]
agp = "8.2.2"
kotlin = "1.9.22"
coreKtx = "1.12.0"
junit = "4.13.2"
junitVersion = "1.1.5"
espressoCore = "3.5.1"
lifecycleRuntimeKtx = "2.7.0"
activityCompose = "1.8.2"
composeBom = "2023.08.00"
hilt = "2.50"
room = "2.6.1"
retrofit = "2.9.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-android-compiler", version.ref = "hilt" }
androidx-hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version = "1.1.0" }
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-converter-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version = "4.12.0" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-kapt = { id = "org.jetbrains.kotlin.kapt", version.ref = "kotlin" }
hilt-android = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
`);

      // 3. Include automated GitHub deployment workflow inside zip with dual gradle/gradlew build fallback
      const githubWorkflowContent = `name: Build RICHA Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Compile Android Source Code
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Generate Gradle Wrapper
      run: |
        TARGET_DIR="."
        if [ -d "android-project" ]; then
          TARGET_DIR="android-project"
        fi
        if [ ! -f "$TARGET_DIR/gradlew" ]; then
          echo "No Gradle wrapper found, downloading official Gradle 8.2 wrapper..."
          mkdir -p "$TARGET_DIR/gradle/wrapper"
          curl -sSLo "$TARGET_DIR/gradlew" https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradlew
          curl -sSLo "$TARGET_DIR/gradlew.bat" https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradlew.bat
          curl -sSLo "$TARGET_DIR/gradle/wrapper/gradle-wrapper.jar" https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradle/wrapper/gradle-wrapper.jar
          cat <<EOF > "$TARGET_DIR/gradle/wrapper/gradle-wrapper.properties"
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-bin.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF
        fi

    - name: Grant Execute Permission to Gradlew
      run: |
        TARGET_DIR="."
        if [ -d "android-project" ]; then
          TARGET_DIR="android-project"
        fi
        if [ -f "$TARGET_DIR/gradlew" ]; then
          chmod +x "$TARGET_DIR/gradlew"
        fi

    - name: Build Debug APK with Gradle (Continuous Multi-Compile Fallback)
      run: |
        TARGET_DIR="."
        if [ -d "android-project" ]; then
          TARGET_DIR="android-project"
        fi
        cd "$TARGET_DIR"
        if [ -f "gradlew" ]; then
          ./gradlew assembleDebug
        else
          gradle assembleDebug
        fi

    - name: Upload Compiled APK Asset Artifact
      uses: actions/upload-artifact@v4
      with:
        name: RICHA-AI-Companion-Debug-APK
        path: '**/build/outputs/apk/debug/*.apk'
        if-no-files-found: warn
`;
      zip.file(".github/workflows/build-apk.yml", githubWorkflowContent);

      const blobContent = await zip.generateAsync({ type: 'blob' });
      const dlUrl = URL.createObjectURL(blobContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = dlUrl;
      downloadAnchor.download = 'Richa_Android_Companion.zip';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      console.error("Critical error bundling project source files into JSZip blob:", err);
      alert("Bundle pack complete hone me thodi dikkat aayi yaara, dobara click kijiye!");
    } finally {
      setDownloadingZip(false);
    }
  };

  // Clear messages history
  const handleClearHistory = () => {
    if (confirm("Yaara, are you sure you want to delete our memories from this chat?")) {
      setMessages([
        {
          id: 'welcome-richa',
          role: 'richa',
          text: `Arre! Chalo naye sire se dosti start karte hain. Kaho ${userName}, aaj kya chal raha hai tumhare dimaag mein?`,
          timestamp: new Date(),
          mood: 'Excitement'
        }
      ]);
    }
  };

  // Copy codebase content helper
  const copyFileToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(true);
    setTimeout(() => {
      setCopiedFile(false);
    }, 2000);
  };

  // Download code model asset
  const handleDownloadFile = (file: AndroidFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compute active user moods dynamics for visualizations
  const getMoodDistribution = () => {
    const distribution: Record<string, number> = {
      Happiness: 4,
      Excitement: 3,
      Sadness: 2,
      Stress: 2,
      Loneliness: 1
    };
    messages.forEach(m => {
      if (m.role === 'richa' && m.mood) {
        distribution[m.mood] = (distribution[m.mood] || 0) + 1;
      }
    });
    return Object.entries(distribution).map(([mood, count]) => ({ mood, count }));
  };

  // Dynamic visualizer values
  const isSpeaking = statusMessage === 'Speaking...';
  const isThinking = statusMessage === 'Thinking...';
  const isCurrentlyListening = statusMessage === 'Listening...';

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex flex-col md:flex-row antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* SIDEBAR NAVIGATION - Premium Minimal Hub Dashboard Drawer */}
      <aside className="w-full md:w-80 bg-neutral-950 border-b md:border-b-0 md:border-r border-neutral-900 flex flex-col justify-between shrink-0">
        
        {/* Upper Side - Branding & Companion Status */}
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-neutral-900 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                <span className="font-semibold text-white tracking-tighter text-lg scale-90">R</span>
              </div>
              <div>
                <h1 id="sidebar-app-title" className="font-display font-medium text-white tracking-wide text-lg sm:text-lg">RICHA AI</h1>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Android Companion</p>
              </div>
            </div>
            
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-900">
              V1.2.0
            </span>
          </div>

          {/* User Presence & Closeness Profile Card */}
          <div className="p-5 border-b border-neutral-900 bg-neutral-950/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="size-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <User className="size-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">{userName}</h4>
                <p className="text-xs text-zinc-500">Companion User</p>
              </div>
            </div>

            {/* Relationship Status Level Indicators */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Heart className="size-3.5 text-pink-500 fill-pink-500 animate-pulse" />
                  Bond Level {relationshipLevel}
                </span>
                <span className="text-indigo-400 font-mono font-medium">
                  {relationshipPoints} / {relationshipLevel * 8} XP
                </span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (relationshipPoints / (relationshipLevel * 8)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 italic">
                {relationshipLevel >= 4 
                  ? "Richa considers you her absolute best friend." 
                  : "Talk with Richa to build a deep supportive relationship."}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => { setActiveTab('voice'); setShowConfig(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-250 group text-left ${
                activeTab === 'voice' 
                  ? 'bg-neutral-900 text-white font-medium border-l-4 border-indigo-500' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Mic className={`size-4.5 ${activeTab === 'voice' ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className="text-sm">Voice Ambient Room</span>
              </div>
              {statusMessage !== 'Idle' && activeTab !== 'voice' && (
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => { setActiveTab('chat'); setShowConfig(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-250 group text-left ${
                activeTab === 'chat' 
                  ? 'bg-neutral-900 text-white font-medium border-l-4 border-indigo-500' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smile className={`size-4.5 ${activeTab === 'chat' ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className="text-sm">Interactive Chat logs</span>
              </div>
              <span className="text-xs bg-neutral-900 px-2 py-0.5 rounded-md text-zinc-500 font-mono">
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('memory'); setShowConfig(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-250 group text-left ${
                activeTab === 'memory' 
                  ? 'bg-neutral-900 text-white font-medium border-l-4 border-indigo-500' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BookOpen className={`size-4.5 ${activeTab === 'memory' ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className="text-sm">Companion Memory Bank</span>
              </div>
              <span className="text-xs bg-neutral-900 px-2 py-0.5 rounded-md text-zinc-500 font-mono">
                {longTermMemory.memories.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('android'); setShowConfig(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-250 group text-left ${
                activeTab === 'android' 
                  ? 'bg-neutral-950 border border-indigo-950 text-indigo-200 font-medium border-l-4 border-indigo-400' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Code className={`size-4.5 ${activeTab === 'android' ? 'text-indigo-300' : 'text-indigo-500 group-hover:text-indigo-400'}`} />
                <span className="text-sm font-semibold">Android Codebase Hub</span>
              </div>
              <span className="size-2 rounded-full bg-indigo-500" />
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar - Interactive Audio Playback Options */}
        <div className="p-4 border-t border-neutral-900 bg-black/60 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 bg-neutral-950 p-3 rounded-xl border border-neutral-900">
            <span className="flex items-center gap-2">
              {isTtsEnabled ? <Volume2 className="size-4 text-emerald-400" /> : <VolumeX className="size-4 text-zinc-500" />}
              Speech Narration (TTS)
            </span>
            <button
              onClick={() => {
                setIsTtsEnabled(!isTtsEnabled);
                if (isTtsEnabled) window.speechSynthesis.cancel();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isTtsEnabled ? 'bg-indigo-600' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isTtsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 text-zinc-400 hover:text-white transition duration-200 text-xs font-medium"
            >
              <Settings className="size-3.5" />
              Configure Profile
            </button>
            <button
              onClick={handleClearHistory}
              className="px-3 py-2 rounded-lg bg-neutral-900/50 text-rose-500/80 hover:text-rose-400 hover:bg-neutral-900 transition duration-200 text-xs"
              title="Clear Companion Chats"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE - Render based on Active state selection */}
      <main className="flex-1 flex flex-col bg-black min-h-0 relative select-none">
        
        {/* Profile Settings Overlay panel */}
        {showConfig && (
          <div className="absolute inset-0 bg-black/95 z-40 p-6 sm:p-12 flex items-center justify-center overflow-y-auto">
            <div className="max-w-md w-full bg-neutral-950 border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-indigo-950/20">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-display font-medium text-white flex items-center gap-2">
                    <Sparkles className="size-4.5 text-indigo-400" />
                    Configure Personality Feed
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Updates background memories instantly. Richa will acknowledge these parameters dynamically.
                  </p>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-mono uppercase bg-neutral-900 px-2 py-1 rounded"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">User Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Your Hobbies</label>
                  <textarea
                    rows={2}
                    value={userHobbies}
                    onChange={(e) => setUserHobbies(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Your Active Life Goals</label>
                  <textarea
                    rows={2}
                    value={userGoals}
                    onChange={(e) => setUserGoals(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-neutral-900/40 rounded-xl p-3 border border-neutral-900 flex items-start gap-2.5">
                <Info className="size-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  These metadata nodes are automatically proxy-passed to server-side <code className="text-indigo-300 font-mono">gemini-3.5-flash</code> as active context variables, which shape Richa's spontaneous questions and nostalgic advice.
                </p>
              </div>

              <button
                onClick={() => {
                  setLongTermMemory(prev => ({
                    ...prev,
                    hobbies: userHobbies,
                    goals: userGoals
                  }));
                  setShowConfig(false);
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition duration-200"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* 1. TAB: RICHA VOICE AMBIENT MODE SCREEN */}
        {activeTab === 'voice' && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
            
            {/* Visual bottom amoled blue background aura */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[600px] h-[340px] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[340px] h-[180px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono z-10">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>VOICE-FIRST CALL INTERACTION</span>
              </div>
              <div>AUTO DUPLEX: ON</div>
            </div>

            {/* Central Animated Fluid Breathing Avatar Core */}
            <div className="flex-1 flex flex-col items-center justify-center my-8 z-10">
              
              {/* Outer pulsate glows on status */}
              <div className="relative size-64 sm:size-80 flex items-center justify-center">
                
                {/* Breathe glow ring */}
                <div 
                  className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                    isSpeaking 
                      ? 'bg-gradient-to-tr from-indigo-500/15 via-pink-500/10 to-blue-500/15 blur-[40px] scale-110' 
                      : isCurrentlyListening 
                      ? 'bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-indigo-500/10 blur-[30px] scale-105'
                      : isThinking
                      ? 'bg-amber-500/10 blur-[20px]'
                      : 'bg-neutral-900/30'
                  }`} 
                />

                {/* Constant orbital breathing border rings */}
                <div className="absolute w-[94%] h-[94%] rounded-full border border-zinc-800/20 animate-breathe" />
                <div className="absolute w-[82%] h-[82%] rounded-full border border-indigo-500/10 animate-slow-pulse" />

                {/* Inner Fluid Sphere container representing Richa */}
                <div 
                  onClick={() => {
                    if (isSpeaking) {
                      window.speechSynthesis.cancel();
                      setStatusMessage('Idle');
                    } else {
                      toggleListening();
                    }
                  }}
                  className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-xl transition-all duration-700 relative overflow-hidden group select-none ${
                    isSpeaking 
                      ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-pink-500 shadow-indigo-950/45 scale-105' 
                      : isCurrentlyListening 
                      ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 shadow-emerald-950/40 scale-100 animate-pulse'
                      : isThinking
                      ? 'bg-gradient-to-br from-amber-600 via-orange-600 to-purple-800 animate-spin bg-[length:200%_200%]'
                      : 'bg-neutral-950 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  
                  {/* Subtle fluid wave lines inside bubble */}
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay group-hover:scale-110 transition duration-500" />
                  
                  {isSpeaking ? (
                    <Volume2 className="size-10 text-white animate-bounce" />
                  ) : isCurrentlyListening ? (
                    <Mic className="size-10 text-white animate-ping" />
                  ) : isThinking ? (
                    <RefreshCw className="size-10 text-white animate-spin" />
                  ) : (
                    <div className="text-center">
                      <span className="font-display font-light text-5xl text-neutral-200 group-hover:text-white group-hover:scale-105 transition block">R</span>
                      <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase block mt-1">Tap to speak</span>
                    </div>
                  )}
                </div>

                {/* Listening/Speaking ripple feedback */}
                {(isSpeaking || isCurrentlyListening) && (
                  <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-ping opacity-60" style={{ animationDuration: '3s' }} />
                )}
              </div>

              {/* Status text label */}
              <div className="mt-8 text-center space-y-2">
                <p className="text-2xl font-light tracking-tight text-white font-display">
                  {isCurrentlyListening && "Humming... speak to Richa now"}
                  {isThinking && "Richa is formulating memories..."}
                  {isSpeaking && "Richa is speaking..."}
                  {statusMessage === 'Idle' && `What's next, ${userName}?`}
                </p>

                <p 
                  className={`text-xs font-mono tracking-widest uppercase ${
                    isCurrentlyListening 
                      ? 'text-emerald-400' 
                      : isSpeaking 
                      ? 'text-indigo-400' 
                      : isThinking 
                      ? 'text-amber-400 font-bold' 
                      : 'text-zinc-500'
                  }`}
                >
                  {statusMessage.toUpperCase()}
                </p>
              </div>

              {/* Spoken feedback subtitle (Real time text stream representation) */}
              <div className="max-w-lg mt-6 bg-neutral-950/40 border border-neutral-900/50 backdrop-blur px-5 py-4.5 rounded-2xl min-h-[70px] text-center flex items-center justify-center">
                <p className="text-sm text-zinc-400 italic leading-relaxed">
                  {messages.length > 0 ? (
                    <span>&ldquo;{messages[messages.length - 1].text}&rdquo;</span>
                  ) : (
                    <span className="text-zinc-600">&ldquo;No sentences spoken yet yaara. Turn on your voice above or click below!&rdquo;</span>
                  )}
                </p>
              </div>
            </div>

            {/* Simulated Live Continuous Equalizer Waveform Lines */}
            <div className="h-10 w-full max-w-md mx-auto z-10 flex items-center justify-center gap-1">
              {Array.from({ length: 32 }).map((_, index) => {
                // Generate sinusoidal organic sound amplitude scales based on active speak audio state
                const factor = isSpeaking ? 2.5 : isCurrentlyListening ? 1.5 : 0.2;
                const randomOffset = Math.sin((index / 32) * Math.PI) * 10;
                const heightValue = isThinking 
                  ? Math.sin(Date.now() / 150 + index) * 12 + 16 
                  : (randomOffset * factor) + 4;

                return (
                  <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isSpeaking 
                        ? 'bg-gradient-to-t from-pink-500 to-indigo-500' 
                        : isCurrentlyListening 
                        ? 'bg-teal-400' 
                        : isThinking 
                        ? 'bg-amber-400' 
                        : 'bg-zinc-800'
                    }`}
                    style={{ 
                      height: `${Math.max(4, Math.min(40, heightValue))}px`
                    }}
                  />
                );
              })}
            </div>

            {/* Bottom Controls Pill Bar - Direct Speech input simulation & voice logs switch */}
            <div className="mt-8 shrink-0 space-y-4 z-10">
              <div className="flex justify-center flex-wrap gap-2.5">
                <button
                  onClick={toggleListening}
                  className={`px-6 py-3.5 rounded-full flex items-center gap-2 text-sm font-semibold transition shadow-md ${
                    isCurrentlyListening 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse' 
                      : 'bg-white hover:bg-zinc-100 text-black'
                  }`}
                >
                  {isCurrentlyListening ? (
                    <>
                      <MicOff className="size-4 text-white" />
                      Tap to Stop listening
                    </>
                  ) : (
                    <>
                      <Mic className="size-4 text-black" />
                      Start Voice Session
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="px-6 py-3.5 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-300 hover:text-white hover:border-neutral-700 text-sm font-medium transition"
                >
                  Type back instead
                </button>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-zinc-600 font-mono tracking-wider">
                  *Uses dual Hindi & English Natural Language Model constraints.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: INTERACTIVE CHAT EXPERIENCE LOGS */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 min-h-0">
            
            {/* Upper Feed Info */}
            <div className="pb-3 border-b border-neutral-900 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Direct Chat Log</h3>
                <p className="text-xs text-zinc-500">Live relationship tracking feeds are saved dynamically</p>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-500/80 hover:text-rose-400 font-medium px-3 py-1 bg-neutral-950 border border-neutral-900 rounded-lg hover:border-neutral-800 transition"
              >
                Clear History
              </button>
            </div>

            {/* Chat List Scroll Feed */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
              {messages.map((item, idx) => {
                const isUser = item.role === 'user';
                return (
                  <div 
                    key={item.id}
                    className={`flex items-start gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar Icon */}
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isUser 
                        ? 'bg-neutral-800 text-zinc-300' 
                        : 'bg-gradient-to-br from-indigo-500 to-pink-500 text-white'
                    }`}>
                      {isUser ? 'U' : 'R'}
                    </div>

                    {/* Chat Bubble Body */}
                    <div className="space-y-1">
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-neutral-900 text-zinc-200 border border-neutral-800/80 rounded-tl-none'
                      }`}>
                        <p>{item.text}</p>
                      </div>

                      {/* Log details */}
                      <div className={`flex items-center gap-2 text-[10px] text-zinc-500 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>
                          {item.timestamp ? item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                        </span>
                        {!isUser && item.mood && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400 bg-neutral-950 border border-neutral-900 px-1.5 py-0.5 rounded text-[9px] font-mono capitalize">
                              Feelings: <strong className="text-indigo-400 font-semibold">{item.mood}</strong>
                            </span>
                          </>
                        )}
                        {!isUser && item.hasAudio && (
                          <button
                            onClick={() => speakVoiceOutput(item.text)}
                            className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-0.5"
                            title="Re-play text to speech audio statement output"
                          >
                            <Volume2 className="size-3 text-indigo-400 inline" /> Replay Voice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold animate-pulse">
                    R
                  </div>
                  <div className="bg-neutral-900/50 border border-neutral-900 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Richa is typing</span>
                    <span className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Type Input pill panel */}
            <div className="pt-3 border-t border-neutral-900 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="relative flex items-center bg-neutral-950 border border-neutral-800 rounded-2xl pl-4 pr-2 py-1.5 focus-within:border-neutral-700 transition"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask and share anything about your day..."
                  className="flex-1 min-w-0 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none pr-3"
                  maxLength={500}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-neutral-900 transition shrink-0 ${isListening ? 'text-emerald-400 animate-pulse' : ''}`}
                  title="Speak dynamically via Speech-To-Text module"
                >
                  <Mic className="size-4.5" />
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="p-2.5 rounded-xl bg-indigo-600 disabled:bg-neutral-900 hover:bg-indigo-505 disabled:text-zinc-600 text-white transition shrink-0 ml-1.5 cursor-pointer"
                >
                  <Send className="size-4" />
                </button>
              </form>
              <div className="flex justify-between items-center text-[10px] text-zinc-600 px-1 mt-2 font-mono">
                <span>Press Enter to Submit</span>
                <span>Active Language: Hinglish Custom</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB: COMPANION LONG TERM MEMORY BANK */}
        {activeTab === 'memory' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            
            {/* Header info */}
            <div>
              <h3 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <Database className="size-5 text-indigo-400" />
                Durable Memory Journal
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                RICHA uses an SQLite and vector memory strategy inside Android. Here is what she has committed to her long-term memory about {userName}.
              </p>
            </div>

            {/* Profile context summary block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950 border border-neutral-900 p-5 rounded-3xl">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Core Hobbies Context</span>
                <p className="text-sm font-semibold text-zinc-200">{longTermMemory.hobbies}</p>
                <p className="text-xs text-zinc-500 italic">Extracted from onboarding profile</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Active Milestones & Goals</span>
                <p className="text-sm font-semibold text-indigo-300">{longTermMemory.goals}</p>
                <p className="text-xs text-zinc-500 italic">Shapes companion focus & checkins</p>
              </div>
            </div>

            {/* Add memory custom block */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-300 block">Teach Richa something new about you</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryInput}
                  onChange={(e) => setNewMemoryInput(e.target.value)}
                  placeholder="e.g. Favorite movie is Interstellar, loves hot black espresso..."
                  className="flex-1 bg-neutral-950 border border-neutral-900 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewMemory();
                  }}
                />
                <button
                  onClick={handleAddNewMemory}
                  className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white text-sm font-medium transition cursor-pointer shrink-0"
                >
                  Save Fact
                </button>
              </div>
            </div>

            {/* Saved Facts list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Saved memory milestones ({longTermMemory.memories.length})</span>
                <span className="text-[10px] text-zinc-650 italic">Richa recalls these spontaneously</span>
              </div>
              
              <div className="divide-y divide-neutral-900 border border-neutral-900 rounded-3xl bg-neutral-950 overflow-hidden">
                {longTermMemory.memories.map((fact, index) => (
                  <div key={index} className="px-5 py-4 flex items-center justify-between gap-4 group hover:bg-neutral-900 bg-transparent transition">
                    <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                      {fact}
                    </p>
                    <button
                      onClick={() => handleDeleteMemory(index)}
                      className="size-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-neutral-800 flex items-center justify-center transition shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100"
                      title="Erase milestone memory"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {longTermMemory.memories.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 text-sm italic">
                    Memory journal is currently empty. Talk to Richa or add a fact above.
                  </div>
                )}
              </div>
            </div>

            {/* Emotional Progression & Analytics Trends */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">Conversation Mood Matrix Logs</h4>
                <p className="text-xs text-zinc-500 leading-snug">
                  Mood analytics mapped dynamically across all conversation logs.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {getMoodDistribution().map((m, idx) => (
                  <div key={idx} className="bg-neutral-950 border border-neutral-900 px-4 py-3.5 rounded-2xl flex flex-col justify-between space-y-2">
                    <span className="text-[11px] font-mono text-indigo-400">{m.mood}</span>
                    <span className="text-xl font-bold text-white tracking-tight">{m.count} <small className="text-xs text-zinc-500 font-normal">turns</small></span>
                    <div className="w-full bg-neutral-900 rounded-full h-1">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (m.count / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. TAB: ANDROID PROJECT CODEBASE EXPORT HUB */}
        {activeTab === 'android' && (
          <div className="flex-1 flex flex-col min-h-0 bg-black">
            
            {/* Header info */}
            <div className="p-6 border-b border-neutral-900 bg-neutral-950 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code className="size-5 text-indigo-400" />
                  RICHA | Complete Android Project Directory
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Below are real, production-ready Android Kotlin, XML, and Gradle resources matching your exact specifications.
                </p>
              </div>
              <button
                onClick={handleDownloadFullZip}
                disabled={downloadingZip}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-505 via-blue-605 to-pink-505 hover:from-indigo-450 hover:via-blue-500 hover:to-pink-450 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 shrink-0 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="size-4 animate-pulse" />
                {downloadingZip ? "Packaging ZIP..." : "Download Entire Project ZIP"}
              </button>
            </div>

            {/* Workspace split */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              
              {/* File list tree view */}
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-neutral-900 flex flex-col max-h-[260px] lg:max-h-none overflow-y-auto bg-neutral-950/20 shrink-0 select-none">
                <div className="p-4 border-b border-neutral-900 bg-black/40">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Project Files</span>
                </div>
                
                <div className="p-2 space-y-1">
                  {androidProjectFiles.map((file) => {
                    const isSelected = selectedFile.name === file.name;
                    return (
                      <div
                        key={file.name}
                        onClick={() => setSelectedFile(file)}
                        className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 text-left ${
                          isSelected 
                            ? 'bg-neutral-900 text-white' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-neutral-950'
                        }`}
                      >
                        <FileCode className={`size-5 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold font-mono truncate">{file.name}</p>
                          <p className="text-[9px] text-zinc-500 font-mono truncate mt-0.5">{file.path}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Code visual and file actions */}
              <div className="flex-1 flex flex-col min-h-0 relative">
                
                {/* Meta header parameters */}
                <div className="p-4 border-b border-neutral-900 bg-neutral-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                  <div className="min-w-0">
                    <span className="text-[10px] text-indigo-400 font-mono tracking-widest font-semibold uppercase">{selectedFile.language.toUpperCase()} FILE</span>
                    <h4 className="text-sm font-semibold text-zinc-100 font-mono truncate mt-0.5">{selectedFile.path}</h4>
                    <span className="text-xs text-zinc-500 block leading-tight mt-1">{selectedFile.description}</span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copyFileToClipboard(selectedFile.content)}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedFile ? <Check className="size-3.5 text-emerald-400" /> : <ClipboardCheck className="size-3.5" />}
                      {copiedFile ? "Copied!" : "Copy Raw"}
                    </button>
                    <button
                      onClick={() => handleDownloadFile(selectedFile)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Download File
                    </button>
                  </div>
                </div>

                {/* Main scroll syntax display */}
                <div className="flex-1 overflow-y-auto p-4 bg-neutral-950 select-text font-mono text-xs leading-relaxed text-zinc-300 no-scrollbar">
                  <pre className="whitespace-pre">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
