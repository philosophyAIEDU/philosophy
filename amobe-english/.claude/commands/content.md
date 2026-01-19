---
description: 영어 학습 콘텐츠 생성 (listening/reading/writing/vocab)
---

# 학습 콘텐츠 생성

**사용법**: `/content [type] [level] [topic]`

## 파라미터
- `type`: listening | reading | writing | vocab
- `level`: beginner | intermediate | advanced (기본: intermediate)
- `topic`: 주제 (선택)

## 예시
- `/content listening intermediate airport`
- `/content vocab beginner daily-life`
- `/content reading advanced technology`

## 작업
1. content-creator agent에 위임
2. 적절한 JSON 형식으로 콘텐츠 생성
3. `src/data/[type]/` 폴더에 저장

$ARGUMENTS
