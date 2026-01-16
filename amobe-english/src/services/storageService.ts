import { StorageData } from '../types/user';
import { VocabularyItem, UserProgress, LearningSession } from '../types/learning';

const STORAGE_KEY = 'amobe-english';

// Simple encoding for API key (not secure, just obfuscation)
const encodeApiKey = (key: string): string => {
  return btoa(key.split('').reverse().join(''));
};

const decodeApiKey = (encoded: string): string => {
  try {
    return atob(encoded).split('').reverse().join('');
  } catch {
    return encoded;
  }
};

class StorageService {
  private loadAll(): StorageData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveAll(data: StorageData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  save<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
    const data = this.loadAll();
    if (key === 'apiKey' && typeof value === 'string') {
      (data as any)[key] = encodeApiKey(value);
    } else {
      data[key] = value;
    }
    this.saveAll(data);
  }

  load<K extends keyof StorageData>(key: K): StorageData[K] | null {
    const data = this.loadAll();
    const value = data[key];
    if (key === 'apiKey' && typeof value === 'string') {
      return decodeApiKey(value) as StorageData[K];
    }
    return value || null;
  }

  remove<K extends keyof StorageData>(key: K): void {
    const data = this.loadAll();
    delete data[key];
    this.saveAll(data);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Vocabulary helpers
  addVocabulary(item: VocabularyItem): void {
    const vocabulary = this.load('vocabulary') || [];
    vocabulary.push(item);
    this.save('vocabulary', vocabulary);
  }

  removeVocabulary(id: string): void {
    const vocabulary = this.load('vocabulary') || [];
    this.save('vocabulary', vocabulary.filter(v => v.id !== id));
  }

  updateVocabulary(id: string, updates: Partial<VocabularyItem>): void {
    const vocabulary = this.load('vocabulary') || [];
    const index = vocabulary.findIndex(v => v.id === id);
    if (index !== -1) {
      vocabulary[index] = { ...vocabulary[index], ...updates };
      this.save('vocabulary', vocabulary);
    }
  }

  // Progress helpers
  updateProgress(updates: Partial<UserProgress>): void {
    const progress = this.load('progress') || this.getDefaultProgress();
    this.save('progress', { ...progress, ...updates });
  }

  addLearningSession(session: LearningSession): void {
    const history = this.load('learningHistory') || [];
    history.push(session);
    this.save('learningHistory', history);
  }

  getDefaultProgress(): UserProgress {
    return {
      totalMinutes: 0,
      streakDays: 0,
      lastStudyDate: '',
      moduleStats: {
        listening: { count: 0, minutes: 0 },
        reading: { count: 0, minutes: 0 },
        writing: { count: 0, minutes: 0 },
        speaking: { count: 0, minutes: 0 },
      },
      currentLevel: 'beginner',
      levelProgress: 0,
      weeklyData: [],
    };
  }
}

export default new StorageService();
