export interface User {
  id: string
  email: string
  displayName: string
  isPremium: boolean
  createdAt: Date
  lastLoginAt: Date
}

export interface Document {
  id: string
  title: string
  content: string
  lastModified: Date
  createdAt: Date
  userId: string
  metadata: {
    wordCount: number
    characterCount: number
    readingTime: number
    language: string
  }
  spellingSettings?: {
    personalDictionary: string[]
    autocorrectMap: Record<string, string>
    ignoredErrors: any[]
  }
  isDeleted?: boolean
}

export interface UserSettings {
  fontSize: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  preferences: {
    autoSave: boolean
    spellCheck: boolean
    grammarCheck: boolean
    aiSuggestions: boolean
  }
}

export interface UserStore {
  user: User | null
  settings: UserSettings
  isAuthenticated: boolean
  isLoading: boolean
}

export interface EditorStore {
  currentDocument: Document | null
  documents: Document[]
  isSaving: boolean
  hasUnsavedChanges: boolean
  wordCount: number
  characterCount: number
  dailyCount: number
  dailyGoal: number
  wordGoal: number
  dailyStartCount: number
  prevWordCount: number
  totalWordsWritten: number
  totalDaysActive: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: Date | null
  celebration: boolean

  setCurrentDocument: (document: Document | null) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  setSaving: (isSaving: boolean) => void
  setUnsavedChanges: (hasUnsavedChanges: boolean) => void
  updateWordCount: (wordCount: number) => void
  updateCharacterCount: (characterCount: number) => void
  updateDailyCount: (dailyCount: number) => void
  resetDailyCount: () => void
  setDailyGoal: (dailyGoal: number) => void
  setWordGoal: (wordGoal: number) => void
  setDailyStartCount: (count: number) => void
  setPrevWordCount: (count: number) => void
  setTotalWordsWritten: (count: number) => void
  setTotalDaysActive: (count: number) => void
  setCurrentStreak: (count: number) => void
  setLongestStreak: (count: number) => void
  setLastActiveDate: (date: Date | null) => void
  setCelebration: (celebration: boolean) => void
  loadAnalyticsFromCloud: () => Promise<void>
  saveAnalyticsToCloud: () => Promise<void>
  saveSpellingSettingsToCloud: (documentId: string, personalDictionary: string[], autocorrectMap: Record<string, string>, ignoredErrors: any[]) => Promise<void>
  loadSpellingSettingsFromCloud: (documentId: string) => Promise<{ personalDictionary: string[], autocorrectMap: Record<string, string>, ignoredErrors: any[] }>
  clearDocuments: () => void
}

export interface SettingsStore {
  fontSize: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  preferences: {
    autoSave: boolean
    spellCheck: boolean
    grammarCheck: boolean
    aiSuggestions: boolean
  }
}

export interface GrammarError {
  word: string
  suggestions: string[]
  message: string
  offset: number
  length: number
}

export interface AISuggestion {
  type: 'grammar' | 'style' | 'content' | 'translation'
  text: string
  confidence: number
  explanation?: string
}

export interface CollaborationCursor {
  id: string
  name: string
  color: string
  position: number
  userId: string
}

export interface PremiumFeatures {
  unlimitedDocuments: boolean
  advancedGrammarChecking: boolean
  allFontsAndStyling: boolean
  aiWritingAssistance: boolean
  unlimitedWordCount: boolean
  allExportFormats: boolean
  realTimeCollaboration: boolean
  advancedAnalytics: boolean
  customThemes: boolean
  prioritySupport: boolean
} 