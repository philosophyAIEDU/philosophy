# Amobe English - AI 영어 학습 앱

## 프로젝트 개요
React + TypeScript + Vite + Tailwind 기반 AI 영어 학습 웹앱
Gemini API를 활용한 듣기, 읽기, 쓰기, 단어장, 학습현황 기능 제공

## 기술 스택
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Storage**: LocalStorage (클라이언트)

## 디렉토리 구조
- `src/components/` - UI 컴포넌트
  - `auth/` - 인증 관련
  - `common/` - 공통 컴포넌트 (Button, Card, LoadingSpinner)
  - `layout/` - 레이아웃 (Header, Sidebar, MainLayout)
  - `learning/` - 학습 모듈 (Listening, Reading, Writing, Speaking)
  - `progress/` - 학습 현황
  - `vocabulary/` - 단어장
- `src/hooks/` - 커스텀 React 훅
- `src/services/` - 외부 API 및 비즈니스 로직
- `src/contexts/` - 전역 상태 관리
- `src/types/` - TypeScript 타입 정의
- `src/constants/` - 상수
- `src/utils/` - 유틸리티 함수

## 개발 규칙
1. 컴포넌트는 함수형 + TypeScript로 작성
2. 스타일링은 Tailwind 유틸리티 클래스 사용
3. 커스텀 훅은 `use` 접두사로 명명
4. 타입은 `types/` 폴더에 분리 정의
5. 서비스 로직은 `services/` 폴더에 분리

## 주요 명령어
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run lint` - ESLint 실행
- `npm run type-check` - TypeScript 타입 체크

## 학습 모듈 구조
- **Listening**: 오디오 재생 + 받아쓰기 + AI 피드백
- **Reading**: 지문 제시 + 독해 문제 + AI 해설
- **Writing**: 주제 제시 + 작문 + AI 첨삭
- **Vocabulary**: 단어 학습 + 플래시카드 + 복습

## AI 연동
- `services/geminiService.ts` - Gemini API 호출
- `hooks/useGemini.ts` - React 훅 래퍼
- API 키는 LocalStorage에 저장 (`components/auth/ApiKeySetup.tsx`)

## 슬래시 명령어
- `/content [type]` - 학습 콘텐츠 생성
- `/component [name]` - React 컴포넌트 생성
- `/review [target]` - 코드 리뷰
- `/docs [type]` - 문서화
- `/fix [issue]` - 버그 수정
