export interface Message {
  id: string;
  role: 'user' | 'richa';
  text: string;
  timestamp: Date;
  mood?: string;
  hasAudio?: boolean;
}

export interface UserProfile {
  name: string;
  goals: string;
  hobbies: string;
}

export interface LongTermMemory {
  hobbies: string;
  goals: string;
  memories: string[];
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  detectedMood: string;
}

export interface MoodRecord {
  date: string;
  mood: string;
  count: number;
}

export interface AndroidFile {
  name: string;
  path: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'json';
  description: string;
  content: string;
}
