import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Document, EditorStore } from '@/types'

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      documents: [],
      isSaving: false,
      hasUnsavedChanges: false,
      wordCount: 0,
      characterCount: 0,
      dailyCount: 0,
      dailyGoal: 0,
      wordGoal: 10000,
      dailyStartCount: 0,
      prevWordCount: 0,
      totalWordsWritten: 0,
      totalDaysActive: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      celebration: false,
      activeFontSize: 14, // Default font size (will be overridden by document page)

      setCurrentDocument: (document: Document | null) => {
        set({ currentDocument: document })
      },

      addDocument: (document: Document) => {
        set((state) => ({
          documents: [...state.documents, document]
        }))
      },

      updateDocument: (id: string, updates: Partial<Document>) => {
        set((state) => ({
          documents: state.documents.map(doc => 
            doc.id === id ? { ...doc, ...updates } : doc
          ),
          currentDocument: state.currentDocument?.id === id 
            ? { ...state.currentDocument, ...updates }
            : state.currentDocument
        }))
      },

      deleteDocument: (id: string) => {
        set((state) => ({
          documents: state.documents.filter(doc => doc.id !== id),
          currentDocument: state.currentDocument?.id === id 
            ? null 
            : state.currentDocument
        }))
      },

      setSaving: (isSaving: boolean) => {
        set({ isSaving })
      },

      setUnsavedChanges: (hasUnsavedChanges: boolean) => {
        set({ hasUnsavedChanges })
      },

      updateWordCount: (wordCount: number) => {
        set({ wordCount })
      },

      updateCharacterCount: (characterCount: number) => {
        set({ characterCount })
      },

      updateDailyCount: (dailyCount: number) => {
        set({ dailyCount })
      },

      resetDailyCount: () => {
        set({ dailyCount: 0 })
      },

      setDailyGoal: (dailyGoal: number) => {
        set({ dailyGoal })
      },

      setWordGoal: (wordGoal: number) => {
        set({ wordGoal })
      },

      setDailyStartCount: (count: number) => {
        set({ dailyStartCount: count })
      },

      setPrevWordCount: (count: number) => {
        set({ prevWordCount: count })
      },

      setTotalWordsWritten: (count: number) => {
        set({ totalWordsWritten: count })
      },

      setTotalDaysActive: (count: number) => {
        set({ totalDaysActive: count })
      },

      setCurrentStreak: (count: number) => {
        set({ currentStreak: count })
      },

      setLongestStreak: (count: number) => {
        set({ longestStreak: count })
      },

      setLastActiveDate: (date: Date | null) => {
        set({ lastActiveDate: date })
      },

      setCelebration: (celebration: boolean) => {
        set({ celebration });
      },

      setActiveFontSize: (fontSize: number) => {
        set({ activeFontSize: fontSize });
      },

      resetFontSize: () => {
        set({ activeFontSize: 14 }); // Default to 14px (size 11)
      },

      // Load analytics from cloud
      loadAnalyticsFromCloud: async () => {
        try {
          const response = await fetch('/api/analytics');
          if (response.ok) {
            const data = await response.json();
            set({
              dailyCount: data.dailyCount ?? 0,
              dailyGoal: data.dailyGoal ?? 0,
              wordGoal: data.wordGoal || 10000,
              dailyStartCount: data.dailyStartCount || 0,
              prevWordCount: data.prevWordCount || 0,
              totalWordsWritten: data.totalWordsWritten || 0,
              totalDaysActive: data.totalDaysActive || 0,
              currentStreak: data.currentStreak || 0,
              longestStreak: data.longestStreak || 0,
              lastActiveDate: data.lastActiveDate ? new Date(data.lastActiveDate) : null,
              celebration: data.celebration ?? false,
              activeFontSize: data.activeFontSize ?? 14,
            });
          }
        } catch (error) {
          console.error('Failed to load analytics from cloud:', error);
        }
      },

      // Save analytics to cloud
      saveAnalyticsToCloud: async () => {
        try {
          const state = get();
          const analyticsData = {
            dailyCount: state.dailyCount,
            dailyGoal: state.dailyGoal,
            wordGoal: state.wordGoal,
            dailyStartCount: state.dailyStartCount,
            prevWordCount: state.prevWordCount,
            totalWordsWritten: state.totalWordsWritten,
            totalDaysActive: state.totalDaysActive,
            currentStreak: state.currentStreak,
            longestStreak: state.longestStreak,
            lastActiveDate: state.lastActiveDate,
            celebration: state.celebration,
            activeFontSize: state.activeFontSize,
          };
          
          await fetch('/api/analytics', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(analyticsData),
          });
        } catch (error) {
          console.error('Failed to save analytics to cloud:', error);
        }
      },

      // Save spelling settings to cloud (per document)
      saveSpellingSettingsToCloud: async (documentId: string, personalDictionary: string[], autocorrectMap: Record<string, string>, ignoredErrors: any[]) => {
        try {
          // Update the current document's spelling settings
          const state = get();
          const updatedDocuments = state.documents.map(doc => 
            doc.id === documentId 
              ? { ...doc, spellingSettings: { personalDictionary, autocorrectMap, ignoredErrors } }
              : doc
          );
          
          set({ documents: updatedDocuments });
          
          // Save to cloud
          await fetch('/api/settings/spelling', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentId,
              personalDictionary,
              autocorrectMap,
              ignoredErrors,
            }),
          });
        } catch (error) {
          console.error('Failed to save spelling settings to cloud:', error);
        }
      },

      // Load spelling settings from cloud (per document)
      loadSpellingSettingsFromCloud: async (documentId: string) => {
        try {
          // First check if we have the settings in the current document
          const state = get();
          const currentDocument = state.documents.find(doc => doc.id === documentId);
          
          if (currentDocument?.spellingSettings) {
            console.log('🔍 [SPELLING] Loaded settings from current document:', currentDocument.spellingSettings);
            return currentDocument.spellingSettings;
          }
          
          // If not in current document, try to load from cloud
          const response = await fetch(`/api/settings/spelling?documentId=${documentId}`);
          if (response.ok) {
            const data = await response.json();
            const settings = {
              personalDictionary: data.personalDictionary || [],
              autocorrectMap: data.autocorrectMap || {},
              ignoredErrors: data.ignoredErrors || [],
            };
            
            // Update the document with the loaded settings
            const updatedDocuments = state.documents.map(doc => 
              doc.id === documentId 
                ? { ...doc, spellingSettings: settings }
                : doc
            );
            
            set({ documents: updatedDocuments });
            console.log('🔍 [SPELLING] Loaded settings from cloud:', settings);
            return settings;
          }
        } catch (error) {
          console.error('Failed to load spelling settings from cloud:', error);
        }
        
        // Return default settings if nothing found
        const defaultSettings = {
          personalDictionary: [],
          autocorrectMap: {},
          ignoredErrors: [],
        };
        console.log('🔍 [SPELLING] Using default settings:', defaultSettings);
        return defaultSettings;
      },

      clearDocuments: () => {
        set({
          documents: [],
          currentDocument: null,
          wordCount: 0,
          characterCount: 0,
        })
      },
    }),
    {
      name: 'penpad_editor',
      partialize: (state) => ({
        documents: state.documents,
        currentDocument: state.currentDocument,
        dailyCount: state.dailyCount,
        dailyGoal: state.dailyGoal,
        wordGoal: state.wordGoal,
        dailyStartCount: state.dailyStartCount,
        prevWordCount: state.prevWordCount,
        totalWordsWritten: state.totalWordsWritten,
        totalDaysActive: state.totalDaysActive,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate,
        celebration: state.celebration,
        activeFontSize: state.activeFontSize,
      }),
    }
  )
) 