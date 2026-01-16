import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserProgress, VocabularyItem, ModuleType } from '../types/learning';
import { UserProfile } from '../types/user';
import storageService from '../services/storageService';
import geminiService from '../services/geminiService';

interface AppState {
  apiKey: string | null;
  isApiKeyValid: boolean;
  userProfile: UserProfile | null;
  progress: UserProgress;
  vocabulary: VocabularyItem[];
  currentModule: ModuleType | null;
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
}

type AppAction =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_API_KEY_VALID'; payload: boolean }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'SET_PROGRESS'; payload: UserProgress }
  | { type: 'SET_VOCABULARY'; payload: VocabularyItem[] }
  | { type: 'ADD_VOCABULARY'; payload: VocabularyItem }
  | { type: 'REMOVE_VOCABULARY'; payload: string }
  | { type: 'SET_CURRENT_MODULE'; payload: ModuleType | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'CLEAR_API_KEY' };

const initialState: AppState = {
  apiKey: null,
  isApiKeyValid: false,
  userProfile: null,
  progress: storageService.getDefaultProgress(),
  vocabulary: [],
  currentModule: null,
  isLoading: false,
  error: null,
  darkMode: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'SET_API_KEY_VALID':
      return { ...state, isApiKeyValid: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_VOCABULARY':
      return { ...state, vocabulary: action.payload };
    case 'ADD_VOCABULARY':
      return { ...state, vocabulary: [...state.vocabulary, action.payload] };
    case 'REMOVE_VOCABULARY':
      return {
        ...state,
        vocabulary: state.vocabulary.filter((v) => v.id !== action.payload),
      };
    case 'SET_CURRENT_MODULE':
      return { ...state, currentModule: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'CLEAR_API_KEY':
      return { ...state, apiKey: null, isApiKeyValid: false };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  initializeApiKey: (key: string) => Promise<boolean>;
  updateProgress: (updates: Partial<UserProgress>) => void;
  addToVocabulary: (item: VocabularyItem) => void;
  removeFromVocabulary: (id: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from storage on mount
  useEffect(() => {
    const apiKey = storageService.load('apiKey');
    const userProfile = storageService.load('userProfile');
    const progress = storageService.load('progress');
    const vocabulary = storageService.load('vocabulary');

    if (apiKey) {
      dispatch({ type: 'SET_API_KEY', payload: apiKey });
      geminiService.initialize(apiKey);
      dispatch({ type: 'SET_API_KEY_VALID', payload: true });
    }
    if (userProfile) {
      dispatch({ type: 'SET_USER_PROFILE', payload: userProfile });
      if (userProfile.preferences?.darkMode) {
        dispatch({ type: 'TOGGLE_DARK_MODE' });
      }
    }
    if (progress) {
      dispatch({ type: 'SET_PROGRESS', payload: progress });
    }
    if (vocabulary) {
      dispatch({ type: 'SET_VOCABULARY', payload: vocabulary });
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const initializeApiKey = async (key: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      geminiService.initialize(key);
      const isValid = await geminiService.validateApiKey();

      if (isValid) {
        storageService.save('apiKey', key);
        dispatch({ type: 'SET_API_KEY', payload: key });
        dispatch({ type: 'SET_API_KEY_VALID', payload: true });

        // Create default user profile if not exists
        if (!state.userProfile) {
          const defaultProfile: UserProfile = {
            level: 'beginner',
            goal: 'daily',
            createdAt: new Date().toISOString(),
            preferences: {
              darkMode: false,
              ttsSpeed: 1.0,
              autoPlayAudio: true,
              dailyGoalMinutes: 30,
            },
          };
          storageService.save('userProfile', defaultProfile);
          dispatch({ type: 'SET_USER_PROFILE', payload: defaultProfile });
        }

        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'API Key가 유효하지 않습니다.' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: geminiService.handleError(error) });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateProgress = (updates: Partial<UserProgress>) => {
    const newProgress = { ...state.progress, ...updates };
    storageService.save('progress', newProgress);
    dispatch({ type: 'SET_PROGRESS', payload: newProgress });
  };

  const addToVocabulary = (item: VocabularyItem) => {
    storageService.addVocabulary(item);
    dispatch({ type: 'ADD_VOCABULARY', payload: item });
  };

  const removeFromVocabulary = (id: string) => {
    storageService.removeVocabulary(id);
    dispatch({ type: 'REMOVE_VOCABULARY', payload: id });
  };

  const logout = () => {
    storageService.remove('apiKey');
    dispatch({ type: 'CLEAR_API_KEY' });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        initializeApiKey,
        updateProgress,
        addToVocabulary,
        removeFromVocabulary,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
