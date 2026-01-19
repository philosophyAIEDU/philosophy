---
description: 새 React 컴포넌트 생성
---

# 컴포넌트 생성

**사용법**: `/component [name] [folder]`

## 파라미터
- `name`: 컴포넌트 이름 (PascalCase)
- `folder`: common | layout | learning | progress | vocabulary

## 예시
- `/component QuizCard learning`
- `/component Modal common`
- `/component WeeklyReport progress`

## 작업
1. frontend-dev agent에 위임
2. TypeScript + Tailwind 컴포넌트 생성
3. Props 인터페이스 정의
4. index.ts에 export 추가

$ARGUMENTS
