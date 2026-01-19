---
description: 버그 분석 및 수정
---

# 버그 수정

**사용법**: `/fix [description]`

## 파라미터
- `description`: 버그 설명 또는 에러 메시지

## 예시
- `/fix TypeError: Cannot read property 'map' of undefined`
- `/fix 단어장에서 삭제 버튼이 작동하지 않음`
- `/fix 듣기 모듈에서 오디오가 재생되지 않음`

## 작업
1. code-quality agent에 위임
2. 에러 원인 분석
3. 관련 코드 탐색
4. 수정 방안 제시 및 적용

$ARGUMENTS
