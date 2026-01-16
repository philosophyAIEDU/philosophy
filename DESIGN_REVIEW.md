# Amobe English 웹 앱 설계 검토 보고서

**검토자**: Claude
**검토일**: 2026-01-16
**설계자**: Will (Jenny 협업)
**상태**: 검토 완료 - 수정 필요 항목 있음

---

## 요약

전반적으로 잘 구성된 설계입니다. React + TypeScript + Vite 스택 선택, 학습 순서 철학(듣기→읽기→쓰기→말하기), 모듈 구조가 적절합니다. 그러나 **Gemini API 관련 중요한 기술적 수정이 필요합니다**.

### 평가 등급
- 아키텍처 설계: ✅ 우수
- UI/UX 설계: ✅ 우수
- 기능 설계: ✅ 우수
- **Gemini API 통합: ⚠️ 수정 필요**
- 코드 예제 정확성: ⚠️ 수정 필요

---

## 1. 긴급 수정 필요 사항 (Critical)

### 1.1 Gemini 모델명 오류

설계서에 명시된 모델명이 실제 API와 다릅니다:

| 설계서 모델명 | 올바른 모델명 | 용도 |
|-------------|-------------|------|
| `models/gemini-3-flash-preview` | `gemini-2.0-flash` 또는 `gemini-1.5-flash` | 텍스트 생성 |
| `models/gemini-2.5-flash-preview-tts` | `gemini-2.5-flash-preview-tts` (검증 필요) | TTS |
| `models/gemini-2.5-flash-native-audio-preview-12-2025` | Live API 사용 | 실시간 음성 |

**권장 수정**:
```typescript
// 텍스트 생성용
const TEXT_MODEL = 'gemini-2.0-flash';

// TTS - Google Cloud TTS API 사용 권장
// 또는 Gemini Live API의 audio output 기능 활용

// 실시간 음성 대화 - Gemini Live API (WebSocket 기반)
```

### 1.2 TTS 구현 방식 오류

설계서의 TTS 코드가 실제 Gemini API 동작 방식과 다릅니다:

**문제가 있는 코드 (설계서)**:
```typescript
async generateTTS(text: string): Promise<Blob> {
  const result = await generativeModel.generateContent({
    contents: [{ role: 'user', parts: [{ text }] }]
  });
  const audioData = result.response.audio; // ❌ 이런 속성 없음
  return new Blob([audioData], { type: 'audio/mp3' });
}
```

**올바른 접근법**:
```typescript
// 옵션 1: Web Speech API 사용 (브라우저 내장, 무료)
async generateTTS(text: string): Promise<void> {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  speechSynthesis.speak(utterance);
}

// 옵션 2: Google Cloud Text-to-Speech API 사용
// 별도 API 키 필요, 더 자연스러운 음성

// 옵션 3: Gemini Live API의 audio response 활용
// WebSocket 연결 필요
```

### 1.3 실시간 음성 대화 (Speaking Module) 구현

설계서의 `startAudioSession` 코드는 실제 구현과 크게 다릅니다.

**실제 Gemini Live API 사용법**:
```typescript
// Gemini Live API는 WebSocket 기반
// @google/generative-ai 패키지의 Live API 클라이언트 사용

import { GoogleGenAI, Modality } from '@google/genai';

class SpeakingService {
  private client: GoogleGenAI;
  private session: any;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async startLiveSession(systemInstruction: string) {
    // Live API 연결
    this.session = await this.client.live.connect({
      model: 'gemini-2.0-flash-live-001',
      config: {
        responseModalities: [Modality.AUDIO, Modality.TEXT],
        systemInstruction: systemInstruction,
      },
    });

    // 오디오 수신 핸들러
    this.session.on('audio', (audioData: ArrayBuffer) => {
      this.playAudio(audioData);
    });

    return this.session;
  }

  async sendAudio(audioChunk: ArrayBuffer) {
    await this.session.sendRealtimeInput({
      audio: audioChunk,
    });
  }

  async endSession() {
    await this.session.close();
  }
}
```

---

## 2. 중요 수정 권장 사항 (High Priority)

### 2.1 API 키 보안

**현재 설계**: Local Storage에 API 키 저장

**권장 수정**:
```typescript
// 최소한의 난독화 (완전한 보안은 아님)
const encodeApiKey = (key: string): string => {
  return btoa(key.split('').reverse().join(''));
};

const decodeApiKey = (encoded: string): string => {
  return atob(encoded).split('').reverse().join('');
};

// 사용 시
storageService.save('apiKey', encodeApiKey(userApiKey));
const apiKey = decodeApiKey(storageService.load('apiKey'));
```

**추가 권고**:
- 사용자에게 API 키가 브라우저에 저장됨을 명확히 안내
- 공용 컴퓨터에서는 사용하지 말 것을 권고

### 2.2 에러 핸들링 개선

**설계서 코드**:
```typescript
if (error.code === 'INVALID_API_KEY') // ❌ Gemini API 에러 형식이 아님
```

**올바른 에러 핸들링**:
```typescript
try {
  const result = await geminiService.generateText(...);
} catch (error: any) {
  if (error.message?.includes('API key not valid')) {
    // API 키 재입력 유도
  } else if (error.status === 429) {
    // Rate limit - 잠시 후 다시 시도
  } else if (error.message?.includes('quota')) {
    // 할당량 초과
  } else {
    // 일반 오류
    console.error('Gemini API Error:', error);
  }
}
```

### 2.3 오디오 녹음 개선

**현재 설계 문제점**:
- `sampleRate: 16000` 설정이 `getUserMedia`에서 지원되지 않을 수 있음
- MediaRecorder의 codec 지정 필요

**개선된 코드**:
```typescript
async startRecording(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }
  });

  // 브라우저 지원 확인
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  this.mediaRecorder = new MediaRecorder(stream, { mimeType });
  // ...
}
```

---

## 3. 일반 개선 권장 사항 (Medium Priority)

### 3.1 패키지 버전 업데이트

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0"  // 최신 버전 확인 필요
  }
}
```

**확인 필요**: 2026년 1월 기준 최신 버전 사용 권장

### 3.2 타입 정의 개선

**추가 권장 타입**:
```typescript
// types/gemini.ts
interface GeminiError {
  status?: number;
  message: string;
  details?: any;
}

interface AudioConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
}

// types/learning.ts - 기존 타입에 추가
interface LearningSession {
  id: string;
  module: 'listening' | 'reading' | 'writing' | 'speaking';
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  score?: number;
}
```

### 3.3 상태 관리 고려

현재 설계는 상태 관리 라이브러리를 사용하지 않습니다. 프로젝트 규모를 고려할 때:

**권장**: Context API + useReducer 조합
```typescript
// contexts/AppContext.tsx
interface AppState {
  apiKey: string | null;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  currentModule: string | null;
  isLoading: boolean;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);
```

### 3.4 성능 최적화

**권장 추가 사항**:
```typescript
// React.memo 활용
export const VocabularyCard = React.memo(({ word, meaning, example }: Props) => {
  // ...
});

// useMemo/useCallback 활용
const sortedVocabulary = useMemo(() =>
  vocabulary.sort((a, b) => a.word.localeCompare(b.word)),
  [vocabulary]
);
```

---

## 4. 구조 및 아키텍처 피드백

### 4.1 긍정적 평가

1. **명확한 폴더 구조**: components, services, hooks, types 분리가 적절함
2. **모듈화**: 각 학습 모듈이 독립적으로 잘 분리됨
3. **재사용 가능 컴포넌트**: common/ 디렉토리의 Button, Card, LoadingSpinner
4. **타입 안전성**: TypeScript 인터페이스 정의가 상세함
5. **반응형 설계**: Desktop/Tablet/Mobile 브레이크포인트 정의됨

### 4.2 개선 제안

1. **constants/ 디렉토리 추가**:
```
src/
├── constants/
│   ├── models.ts      # Gemini 모델명
│   ├── prompts.ts     # System Instructions
│   └── themes.ts      # 색상 테마
```

2. **테스트 폴더 추가**:
```
src/
├── __tests__/
│   ├── services/
│   └── components/
```

3. **환경 설정 파일**:
```
// .env.example
VITE_DEFAULT_MODEL=gemini-2.0-flash
```

---

## 5. Speaking Module 특별 검토

Speaking Module은 "가장 복잡"으로 표시되어 있으며, 실제로 가장 많은 수정이 필요합니다.

### 5.1 현실적인 구현 방안

**Phase 1 (MVP)**: 텍스트 기반 대화
```typescript
// 먼저 텍스트로 대화 기능 구현
// 음성은 Web Speech API로 TTS 출력
async function speakText(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  speechSynthesis.speak(utterance);
}
```

**Phase 2**: 음성 입력 추가
```typescript
// Web Speech API의 SpeechRecognition 사용
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Gemini에 텍스트로 전송
};
```

**Phase 3**: Gemini Live API 통합
- WebSocket 연결 구현
- 실시간 오디오 스트리밍
- 가장 복잡하므로 마지막에 구현

### 5.2 권장 구현 순서

1. 텍스트 채팅 UI 구현
2. Gemini 텍스트 대화 연동
3. Web Speech API로 TTS 출력
4. Web Speech API로 음성 입력 (STT)
5. (선택) Gemini Live API 실시간 음성

---

## 6. 최종 권장 사항

### 수정 우선순위

| 우선순위 | 항목 | 난이도 |
|---------|------|--------|
| 1 | Gemini 모델명 수정 | 쉬움 |
| 2 | TTS 구현 방식 변경 (Web Speech API) | 중간 |
| 3 | 에러 핸들링 수정 | 쉬움 |
| 4 | Speaking Module 단계적 구현 | 높음 |
| 5 | API 키 보안 개선 | 쉬움 |

### 구현 시 참고할 수정된 GeminiService

```typescript
// services/geminiService.ts - 수정 버전

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;

  // 실제 사용 가능한 모델
  private static readonly TEXT_MODEL = 'gemini-2.0-flash';

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // 텍스트 생성
  async generateText(
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: GeminiService.TEXT_MODEL,
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // TTS는 Web Speech API 사용 권장
  speakText(text: string, rate: number = 1.0): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  // 구조화된 출력
  async generateJSON<T>(
    prompt: string,
    systemInstruction: string
  ): Promise<T> {
    const model = this.genAI.getGenerativeModel({
      model: GeminiService.TEXT_MODEL,
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as T;
  }

  // API 키 유효성 검사
  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: GeminiService.TEXT_MODEL,
      });
      await model.generateContent('Hello');
      return true;
    } catch {
      return false;
    }
  }
}

export default GeminiService;
```

---

## 7. 결론

Will의 설계는 전체적으로 우수하며, 학습 앱으로서의 구조와 기능이 잘 정의되어 있습니다.
위에서 언급한 Gemini API 관련 수정사항만 반영하면 성공적으로 구현할 수 있습니다.

**핵심 수정 3가지**:
1. Gemini 모델명을 실제 사용 가능한 이름으로 변경
2. TTS는 Web Speech API 사용으로 단순화
3. Speaking Module은 단계적으로 구현 (텍스트 → 음성)

검토를 완료합니다. 질문이 있으시면 알려주세요!

---

*검토 완료: 2026-01-16*
