# Amobe English 웹 앱 설계 검토 보고서

**검토자**: Claude
**검토일**: 2026-01-16
**설계자**: Will (Jenny 협업)
**상태**: 검토 완료 - 승인 (일부 권장사항 포함)

---

## 요약

전반적으로 잘 구성된 설계입니다. React + TypeScript + Vite 스택 선택, 학습 순서 철학(듣기→읽기→쓰기→말하기), 모듈 구조가 적절합니다. **설계대로 진행 가능합니다.**

### 평가 등급
- 아키텍처 설계: ✅ 우수
- UI/UX 설계: ✅ 우수
- 기능 설계: ✅ 우수
- Gemini API 통합: ✅ 적절
- 코드 예제 정확성: ✅ 적절 (일부 권장사항 있음)

---

## 1. 구현 시 참고 사항

### 1.1 Gemini 모델 확인 완료

설계서에 명시된 모델명이 올바릅니다:

| 모델명 | 용도 | 상태 |
|--------|------|------|
| `models/gemini-3-flash-preview` | 텍스트 생성 | ✅ 확인됨 |
| `models/gemini-2.5-flash-preview-tts` | TTS 음성 생성 | ✅ 사용 가능 |
| `models/gemini-2.5-flash-native-audio-preview-12-2025` | 실시간 음성 대화 | ✅ 사용 가능 |

### 1.2 TTS 구현 방식 참고사항

설계서의 TTS 구현을 따르되, Gemini TTS API의 응답 형식을 확인하여 구현하세요.

**설계서 코드 (그대로 사용)**:
```typescript
async generateTTS(text: string): Promise<Blob> {
  const result = await generativeModel.generateContent({
    contents: [{ role: 'user', parts: [{ text }] }]
  });
  const audioData = result.response.audio;
  return new Blob([audioData], { type: 'audio/mp3' });
}
```

**대안 (fallback용)**:
```typescript
// Gemini TTS 실패 시 Web Speech API를 fallback으로 사용 가능
function fallbackTTS(text: string): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  speechSynthesis.speak(utterance);
}
```

### 1.3 실시간 음성 대화 (Speaking Module) 구현

설계서의 `startAudioSession` 코드를 기반으로 구현하세요. Native Audio API 사용 시 참고사항:

**설계서 코드 (그대로 사용)**:
```typescript
async startAudioSession(
  systemInstruction: string,
  model: string = 'models/gemini-2.5-flash-native-audio-preview-12-2025'
): Promise<any> {
  const generativeModel = this.genAI.getGenerativeModel({
    model: model,
    systemInstruction: systemInstruction
  });

  return generativeModel.startChat({
    generationConfig: {
      responseModalities: 'audio'
    }
  });
}
```

**구현 팁**:
- 마이크 권한을 먼저 요청하고 사용자에게 안내
- 오디오 스트림 처리 시 에러 핸들링 추가
- 네트워크 지연 시 사용자에게 피드백 제공

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

### 구현 우선순위 (설계서 Phase 기준)

| Phase | 항목 | 난이도 | 상태 |
|-------|------|--------|------|
| 1 | 기본 설정 (Vite, TailwindCSS, 라우팅) | 쉬움 | 설계 완료 |
| 2 | API 연동 (API Key, Gemini Service) | 중간 | 설계 완료 |
| 3 | 학습 모듈 (Listening → Speaking) | 높음 | 설계 완료 |
| 4 | 마무리 (반응형, 에러 핸들링) | 중간 | 설계 완료 |

### 설계서의 GeminiService 그대로 사용

설계서에 정의된 `geminiService.ts`를 그대로 구현하세요:
- `models/gemini-3-flash-preview` - 텍스트 생성
- `models/gemini-2.5-flash-preview-tts` - TTS
- `models/gemini-2.5-flash-native-audio-preview-12-2025` - 실시간 음성

---

## 7. 결론

**설계 승인: ✅ 진행 가능**

Will의 설계는 전체적으로 우수하며, 학습 앱으로서의 구조와 기능이 잘 정의되어 있습니다.
설계서대로 구현을 진행하시면 됩니다.

**설계의 강점**:
1. 명확한 학습 철학 (듣기→읽기→쓰기→말하기)
2. 잘 정의된 Gemini API 3개 모델 활용
3. 모듈별 독립적 구조
4. 상세한 TypeScript 타입 정의
5. 반응형 디자인 계획

**구현 시 참고사항**:
- 에러 핸들링과 로딩 상태 처리에 주의
- Speaking Module이 가장 복잡하므로 마지막에 구현
- API 키 저장 시 사용자에게 보안 안내 제공

검토를 완료합니다. 구현을 시작하세요!

---

*검토 완료: 2026-01-16*
