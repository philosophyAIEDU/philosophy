// TED 영상 서비스
import type { TedVideo, TedTranscript, TedVocabulary, TedQuiz, Subtitle } from '../types/ted';

const STORAGE_KEY = 'amobe_ted_data';
const FAVORITES_KEY = 'amobe_ted_favorites';
const HISTORY_KEY = 'amobe_ted_history';

// 샘플 TED 영상 데이터 (실제로는 API나 사용자 입력으로 확장)
const sampleTedVideos: TedVideo[] = [
  {
    id: 'ted-001',
    title: 'The power of vulnerability',
    speaker: 'Brené Brown',
    description: 'Brené Brown studies human connection -- our ability to empathize, belong, love.',
    duration: 1214,
    thumbnailUrl: 'https://img.youtube.com/vi/iCvmsMzlF7o/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/iCvmsMzlF7o',
    youtubeId: 'iCvmsMzlF7o',
    tags: ['psychology', 'self', 'emotions'],
    level: 'intermediate',
    views: 60000000,
    publishedAt: '2011-01-03'
  },
  {
    id: 'ted-002',
    title: 'How great leaders inspire action',
    speaker: 'Simon Sinek',
    description: 'Simon Sinek presents a simple but powerful model for inspirational leadership.',
    duration: 1084,
    thumbnailUrl: 'https://img.youtube.com/vi/qp0HIF3SfI4/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/qp0HIF3SfI4',
    youtubeId: 'qp0HIF3SfI4',
    tags: ['leadership', 'business', 'success'],
    level: 'intermediate',
    views: 62000000,
    publishedAt: '2010-05-04'
  },
  {
    id: 'ted-003',
    title: 'Your body language may shape who you are',
    speaker: 'Amy Cuddy',
    description: 'Body language affects how others see us, but it may also change how we see ourselves.',
    duration: 1266,
    thumbnailUrl: 'https://img.youtube.com/vi/Ks-_Mh1QhMc/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/Ks-_Mh1QhMc',
    youtubeId: 'Ks-_Mh1QhMc',
    tags: ['psychology', 'body language', 'confidence'],
    level: 'intermediate',
    views: 68000000,
    publishedAt: '2012-10-01'
  },
  {
    id: 'ted-004',
    title: 'Inside the mind of a master procrastinator',
    speaker: 'Tim Urban',
    description: 'Tim Urban knows that procrastination doesn\'t make sense, but he\'s never been able to shake his habit.',
    duration: 840,
    thumbnailUrl: 'https://img.youtube.com/vi/arj7oStGLkU/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/arj7oStGLkU',
    youtubeId: 'arj7oStGLkU',
    tags: ['humor', 'productivity', 'psychology'],
    level: 'beginner',
    views: 55000000,
    publishedAt: '2016-04-06'
  },
  {
    id: 'ted-005',
    title: 'The surprising habits of original thinkers',
    speaker: 'Adam Grant',
    description: 'How do creative people come up with great ideas?',
    duration: 924,
    thumbnailUrl: 'https://img.youtube.com/vi/fxbCHn6gE3U/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/fxbCHn6gE3U',
    youtubeId: 'fxbCHn6gE3U',
    tags: ['creativity', 'success', 'work'],
    level: 'intermediate',
    views: 15000000,
    publishedAt: '2016-04-26'
  },
  {
    id: 'ted-006',
    title: 'The happy secret to better work',
    speaker: 'Shawn Achor',
    description: 'We believe we should work hard in order to be happy, but could we be thinking about things backwards?',
    duration: 744,
    thumbnailUrl: 'https://img.youtube.com/vi/fLJsdqxnZb0/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/fLJsdqxnZb0',
    youtubeId: 'fLJsdqxnZb0',
    tags: ['happiness', 'work', 'psychology'],
    level: 'beginner',
    views: 25000000,
    publishedAt: '2012-02-01'
  },
  {
    id: 'ted-007',
    title: 'Do schools kill creativity?',
    speaker: 'Sir Ken Robinson',
    description: 'Sir Ken Robinson makes an entertaining and profoundly moving case for creating an education system that nurtures creativity.',
    duration: 1164,
    thumbnailUrl: 'https://img.youtube.com/vi/iG9CE55wbtY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/iG9CE55wbtY',
    youtubeId: 'iG9CE55wbtY',
    tags: ['education', 'creativity', 'children'],
    level: 'intermediate',
    views: 75000000,
    publishedAt: '2007-01-06'
  },
  {
    id: 'ted-008',
    title: 'The puzzle of motivation',
    speaker: 'Dan Pink',
    description: 'Career analyst Dan Pink examines the puzzle of motivation, starting with a fact that social scientists know but most managers don\'t.',
    duration: 1116,
    thumbnailUrl: 'https://img.youtube.com/vi/rrkrvAUbU9Y/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/rrkrvAUbU9Y',
    youtubeId: 'rrkrvAUbU9Y',
    tags: ['motivation', 'business', 'work'],
    level: 'intermediate',
    views: 30000000,
    publishedAt: '2009-08-25'
  },
  {
    id: 'ted-009',
    title: 'The danger of a single story',
    speaker: 'Chimamanda Ngozi Adichie',
    description: 'Our lives, our cultures, are composed of many overlapping stories. Novelist Chimamanda Adichie tells the story of how she found her authentic cultural voice.',
    duration: 1140,
    thumbnailUrl: 'https://img.youtube.com/vi/D9Ihs241zeg/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/D9Ihs241zeg',
    youtubeId: 'D9Ihs241zeg',
    tags: ['culture', 'storytelling', 'africa'],
    level: 'advanced',
    views: 28000000,
    publishedAt: '2009-10-07'
  },
  {
    id: 'ted-010',
    title: 'How to speak so that people want to listen',
    speaker: 'Julian Treasure',
    description: 'Have you ever felt like you\'re talking, but nobody is listening? Julian Treasure demonstrates the how-to\'s of powerful speaking.',
    duration: 600,
    thumbnailUrl: 'https://img.youtube.com/vi/eIho2S0ZahI/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/eIho2S0ZahI',
    youtubeId: 'eIho2S0ZahI',
    tags: ['communication', 'speaking', 'voice'],
    level: 'beginner',
    views: 40000000,
    publishedAt: '2014-06-27'
  },
  {
    id: 'ted-011',
    title: 'What makes a good life? Lessons from the longest study on happiness',
    speaker: 'Robert Waldinger',
    description: 'What keeps us happy and healthy as we go through life? Robert Waldinger shares three important lessons learned from a 75-year-old study on adult development.',
    duration: 780,
    thumbnailUrl: 'https://img.youtube.com/vi/8KkKuTCFvzI/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/8KkKuTCFvzI',
    youtubeId: '8KkKuTCFvzI',
    tags: ['happiness', 'relationships', 'health'],
    level: 'intermediate',
    views: 45000000,
    publishedAt: '2016-01-25'
  },
  {
    id: 'ted-012',
    title: 'The power of introverts',
    speaker: 'Susan Cain',
    description: 'In a culture where being social and outgoing are prized above all else, it can be difficult to be an introvert. Susan Cain argues that introverts have extraordinary talents.',
    duration: 1152,
    thumbnailUrl: 'https://img.youtube.com/vi/c0KYU2j0TM4/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/c0KYU2j0TM4',
    youtubeId: 'c0KYU2j0TM4',
    tags: ['introvert', 'personality', 'psychology'],
    level: 'intermediate',
    views: 35000000,
    publishedAt: '2012-03-02'
  },
  {
    id: 'ted-013',
    title: 'Grit: The power of passion and perseverance',
    speaker: 'Angela Lee Duckworth',
    description: 'Angela Lee Duckworth explains her theory of "grit" as a predictor of success.',
    duration: 384,
    thumbnailUrl: 'https://img.youtube.com/vi/H14bBuluwB8/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/H14bBuluwB8',
    youtubeId: 'H14bBuluwB8',
    tags: ['grit', 'success', 'education'],
    level: 'beginner',
    views: 25000000,
    publishedAt: '2013-05-09'
  },
  {
    id: 'ted-014',
    title: 'Try something new for 30 days',
    speaker: 'Matt Cutts',
    description: 'Is there something you\'ve always meant to do but just haven\'t gotten around to it? Matt Cutts suggests: Try it for 30 days.',
    duration: 210,
    thumbnailUrl: 'https://img.youtube.com/vi/UNP03fDSj1U/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/UNP03fDSj1U',
    youtubeId: 'UNP03fDSj1U',
    tags: ['habits', 'self-improvement', 'motivation'],
    level: 'beginner',
    views: 15000000,
    publishedAt: '2011-07-01'
  },
  {
    id: 'ted-015',
    title: 'The next outbreak? We\'re not ready',
    speaker: 'Bill Gates',
    description: 'In 2014, the world avoided a horrific global outbreak of Ebola. Bill Gates shows us that we\'re not ready for the next epidemic.',
    duration: 510,
    thumbnailUrl: 'https://img.youtube.com/vi/6Af6b_wyiwI/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/6Af6b_wyiwI',
    youtubeId: '6Af6b_wyiwI',
    tags: ['health', 'global issues', 'science'],
    level: 'intermediate',
    views: 43000000,
    publishedAt: '2015-04-03'
  },
  {
    id: 'ted-016',
    title: 'How to make stress your friend',
    speaker: 'Kelly McGonigal',
    description: 'Stress makes your heart pound and your breathing quicken. But Kelly McGonigal urges us to see stress as a positive.',
    duration: 870,
    thumbnailUrl: 'https://img.youtube.com/vi/RcGyVTAoXEU/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/RcGyVTAoXEU',
    youtubeId: 'RcGyVTAoXEU',
    tags: ['stress', 'health', 'psychology'],
    level: 'intermediate',
    views: 28000000,
    publishedAt: '2013-09-04'
  }
];

// 샘플 자막 데이터
const sampleTranscripts: Record<string, TedTranscript> = {
  'ted-004': {
    videoId: 'ted-004',
    language: 'en',
    subtitles: [
      { id: 's1', startTime: 0, endTime: 5, text: "So in college, I was a government major,", translation: "대학에서 저는 정치학을 전공했습니다," },
      { id: 's2', startTime: 5, endTime: 10, text: "which means I had to write a lot of papers.", translation: "그래서 많은 논문을 써야 했죠." },
      { id: 's3', startTime: 10, endTime: 16, text: "Now, when a normal student writes a paper,", translation: "일반적인 학생이 논문을 쓸 때는," },
      { id: 's4', startTime: 16, endTime: 20, text: "they might spread the work out a little like this.", translation: "이렇게 작업을 분산시킵니다." },
      { id: 's5', startTime: 20, endTime: 27, text: "So, you know, you get started maybe a little slowly,", translation: "아시다시피, 조금 천천히 시작하고," },
      { id: 's6', startTime: 27, endTime: 32, text: "but you get enough done in the first week", translation: "하지만 첫 주에 충분히 해놓으면" },
      { id: 's7', startTime: 32, endTime: 38, text: "that with some heavier lifting later on,", translation: "나중에 조금 더 노력하면," },
      { id: 's8', startTime: 38, endTime: 42, text: "everything gets done and things stay civil.", translation: "모든 것이 순조롭게 마무리됩니다." },
      { id: 's9', startTime: 42, endTime: 47, text: "And I would want to do that like that.", translation: "저도 그렇게 하고 싶었어요." },
      { id: 's10', startTime: 47, endTime: 50, text: "That would be the plan.", translation: "그게 계획이었죠." },
      { id: 's11', startTime: 50, endTime: 55, text: "I would have it all ready to go,", translation: "모든 준비를 해두고," },
      { id: 's12', startTime: 55, endTime: 60, text: "but then actually the paper would come along,", translation: "하지만 실제로 논문 마감이 다가오면," },
      { id: 's13', startTime: 60, endTime: 68, text: "and then I would kind of do this.", translation: "저는 이렇게 하곤 했습니다." },
      { id: 's14', startTime: 68, endTime: 75, text: "And that would happen every single paper.", translation: "모든 논문이 다 그랬죠." },
    ],
    fullText: "So in college, I was a government major, which means I had to write a lot of papers. Now, when a normal student writes a paper, they might spread the work out a little like this. So, you know, you get started maybe a little slowly, but you get enough done in the first week that with some heavier lifting later on, everything gets done and things stay civil. And I would want to do that like that. That would be the plan. I would have it all ready to go, but then actually the paper would come along, and then I would kind of do this. And that would happen every single paper."
  }
};

// 샘플 어휘 데이터
const sampleVocabulary: Record<string, TedVocabulary[]> = {
  'ted-004': [
    {
      word: 'procrastinator',
      pronunciation: '/prəˈkræstɪneɪtər/',
      meaning: 'a person who delays or puts things off',
      meaningKo: '미루는 사람, 꾸물거리는 사람',
      partOfSpeech: 'noun',
      exampleFromVideo: 'Inside the mind of a master procrastinator',
      timestamp: 0,
      level: 'intermediate'
    },
    {
      word: 'spread out',
      pronunciation: '/spred aʊt/',
      meaning: 'to distribute over a period of time',
      meaningKo: '분산시키다, 나누다',
      partOfSpeech: 'phrasal verb',
      exampleFromVideo: 'they might spread the work out a little like this',
      timestamp: 16,
      level: 'beginner'
    },
    {
      word: 'heavier lifting',
      pronunciation: '/ˈheviər ˈlɪftɪŋ/',
      meaning: 'more difficult or demanding work',
      meaningKo: '더 힘든 작업, 어려운 일',
      partOfSpeech: 'noun phrase',
      exampleFromVideo: 'with some heavier lifting later on',
      timestamp: 32,
      level: 'intermediate'
    },
    {
      word: 'civil',
      pronunciation: '/ˈsɪvəl/',
      meaning: 'orderly, under control',
      meaningKo: '순조로운, 정상적인',
      partOfSpeech: 'adjective',
      exampleFromVideo: 'everything gets done and things stay civil',
      timestamp: 38,
      level: 'beginner'
    }
  ]
};

// 샘플 퀴즈 데이터
const sampleQuizzes: Record<string, TedQuiz[]> = {
  'ted-004': [
    {
      id: 'q1',
      videoId: 'ted-004',
      type: 'comprehension',
      question: 'What was the speaker\'s major in college?',
      questionKo: '연사의 대학 전공은 무엇이었나요?',
      options: ['Computer Science', 'Government', 'Psychology', 'Business'],
      correctAnswer: 1,
      explanation: 'He says "in college, I was a government major"',
      explanationKo: '그는 "대학에서 저는 정치학을 전공했습니다"라고 말합니다',
      relatedTimestamp: 0
    },
    {
      id: 'q2',
      videoId: 'ted-004',
      type: 'vocabulary',
      question: 'What does "spread out" mean in this context?',
      questionKo: '이 문맥에서 "spread out"의 의미는?',
      options: ['To make wider', 'To distribute over time', 'To share with others', 'To explain in detail'],
      correctAnswer: 1,
      explanation: '"Spread the work out" means to distribute tasks over a period of time',
      explanationKo: '"Spread the work out"은 작업을 시간에 걸쳐 분산시킨다는 의미입니다',
      relatedTimestamp: 16
    },
    {
      id: 'q3',
      videoId: 'ted-004',
      type: 'listening',
      question: 'According to the speaker, what would happen with every single paper?',
      questionKo: '연사에 따르면, 모든 논문에서 어떤 일이 일어났나요?',
      options: [
        'He would finish early',
        'He would procrastinate',
        'He would get help from others',
        'He would give up'
      ],
      correctAnswer: 1,
      explanation: 'He describes how he would procrastinate with every paper',
      explanationKo: '그는 모든 논문에서 어떻게 미뤘는지 설명합니다',
      relatedTimestamp: 68
    }
  ]
};

class TedService {
  private videos: TedVideo[] = [];
  private transcripts: Record<string, TedTranscript> = {};
  private vocabulary: Record<string, TedVocabulary[]> = {};
  private quizzes: Record<string, TedQuiz[]> = {};

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    // Load from localStorage or use sample data
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      this.videos = data.videos || sampleTedVideos;
      this.transcripts = data.transcripts || sampleTranscripts;
      this.vocabulary = data.vocabulary || sampleVocabulary;
      this.quizzes = data.quizzes || sampleQuizzes;
    } else {
      this.videos = sampleTedVideos;
      this.transcripts = sampleTranscripts;
      this.vocabulary = sampleVocabulary;
      this.quizzes = sampleQuizzes;
      this.saveData();
    }
  }

  private saveData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      videos: this.videos,
      transcripts: this.transcripts,
      vocabulary: this.vocabulary,
      quizzes: this.quizzes
    }));
  }

  // Video methods
  getAllVideos(): TedVideo[] {
    return this.videos;
  }

  getVideoById(id: string): TedVideo | undefined {
    return this.videos.find(v => v.id === id);
  }

  getVideosByLevel(level: TedVideo['level']): TedVideo[] {
    return this.videos.filter(v => v.level === level);
  }

  getVideosByTag(tag: string): TedVideo[] {
    return this.videos.filter(v => v.tags.includes(tag.toLowerCase()));
  }

  searchVideos(query: string): TedVideo[] {
    const q = query.toLowerCase();
    return this.videos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.speaker.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.tags.some(t => t.includes(q))
    );
  }

  addVideo(video: Omit<TedVideo, 'id'>): TedVideo {
    const newVideo: TedVideo = {
      ...video,
      id: `ted-${Date.now()}`
    };
    this.videos.push(newVideo);
    this.saveData();
    return newVideo;
  }

  // Transcript methods
  getTranscript(videoId: string): TedTranscript | undefined {
    return this.transcripts[videoId];
  }

  addTranscript(transcript: TedTranscript): void {
    this.transcripts[transcript.videoId] = transcript;
    this.saveData();
  }

  getSubtitleAtTime(videoId: string, time: number): Subtitle | undefined {
    const transcript = this.transcripts[videoId];
    if (!transcript) return undefined;
    return transcript.subtitles.find(s => time >= s.startTime && time < s.endTime);
  }

  // Vocabulary methods
  getVocabulary(videoId: string): TedVocabulary[] {
    return this.vocabulary[videoId] || [];
  }

  addVocabulary(videoId: string, vocab: TedVocabulary): void {
    if (!this.vocabulary[videoId]) {
      this.vocabulary[videoId] = [];
    }
    this.vocabulary[videoId].push(vocab);
    this.saveData();
  }

  // Quiz methods
  getQuizzes(videoId: string): TedQuiz[] {
    return this.quizzes[videoId] || [];
  }

  getQuizzesByType(videoId: string, type: TedQuiz['type']): TedQuiz[] {
    return (this.quizzes[videoId] || []).filter(q => q.type === type);
  }

  addQuiz(quiz: TedQuiz): void {
    if (!this.quizzes[quiz.videoId]) {
      this.quizzes[quiz.videoId] = [];
    }
    this.quizzes[quiz.videoId].push(quiz);
    this.saveData();
  }

  // Favorites
  getFavorites(): string[] {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  addFavorite(videoId: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(videoId)) {
      favorites.push(videoId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }

  removeFavorite(videoId: string): void {
    const favorites = this.getFavorites().filter(id => id !== videoId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }

  isFavorite(videoId: string): boolean {
    return this.getFavorites().includes(videoId);
  }

  // History
  getHistory(): Array<{ videoId: string; watchedAt: string; progress: number }> {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  addToHistory(videoId: string, progress: number): void {
    const history = this.getHistory();
    const existingIndex = history.findIndex(h => h.videoId === videoId);

    if (existingIndex >= 0) {
      history[existingIndex] = {
        videoId,
        watchedAt: new Date().toISOString(),
        progress
      };
    } else {
      history.unshift({
        videoId,
        watchedAt: new Date().toISOString(),
        progress
      });
    }

    // Keep only last 50 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  }

  // Utility
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getAllTags(): string[] {
    const tags = new Set<string>();
    this.videos.forEach(v => v.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }
}

export const tedService = new TedService();
export default tedService;
