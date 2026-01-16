import geminiService from './geminiService';
import { DailyPlan, UserLevel, ModuleType } from '../types/learning';

const COORDINATOR_INSTRUCTION = `
당신은 Amobe English의 Learning Coordinator입니다.
사용자의 메시지를 분석하여 적절한 학습 모듈을 선택하세요.

응답 형식 (JSON):
{
  "module": "listening | reading | writing | speaking | vocabulary | progress",
  "action": "구체적인 행동"
}

예시:
- "듣기 연습하고 싶어" → { "module": "listening", "action": "start_listening" }
- "영어 일기 첨삭해줘" → { "module": "writing", "action": "correct_writing" }
- "대화 연습" → { "module": "speaking", "action": "start_conversation" }
- "단어 복습" → { "module": "vocabulary", "action": "review_words" }
`;

const PLANNER_INSTRUCTION = `
당신은 Amobe English의 학습 플래너입니다.
사용자 레벨에 맞는 오늘의 학습 계획을 생성하세요.

응답 형식 (JSON):
{
  "listening": "구체적인 듣기 과제",
  "reading": "구체적인 읽기 과제",
  "writing": "구체적인 쓰기 과제",
  "speaking": "구체적인 말하기 과제"
}

레벨별 난이도:
- beginner: 기초 문장, 일상 대화, 간단한 주제
- intermediate: 중급 문장, 뉴스/기사, 다양한 주제
- advanced: 고급 표현, 전문 주제, 토론/발표
`;

class CoordinatorService {
  async routeUserRequest(userMessage: string): Promise<{
    module: ModuleType;
    action: string;
  }> {
    try {
      const result = await geminiService.generateJSON<{
        module: ModuleType;
        action: string;
      }>(userMessage, COORDINATOR_INSTRUCTION);
      return result;
    } catch (error) {
      console.error('Routing error:', error);
      return { module: 'listening', action: 'start_listening' };
    }
  }

  async generateDailyPlan(userLevel: UserLevel): Promise<DailyPlan> {
    try {
      const prompt = `사용자 레벨: ${userLevel}\n오늘의 학습 계획을 생성해주세요.`;
      const result = await geminiService.generateJSON<DailyPlan>(
        prompt,
        PLANNER_INSTRUCTION
      );
      return result;
    } catch (error) {
      console.error('Daily plan generation error:', error);
      return this.getDefaultPlan(userLevel);
    }
  }

  getDefaultPlan(level: UserLevel): DailyPlan {
    const plans: Record<UserLevel, DailyPlan> = {
      beginner: {
        listening: '기초 인사말 듣고 따라하기 (5분)',
        reading: '짧은 자기소개 글 읽기',
        writing: '간단한 일기 3문장 쓰기',
        speaking: '카페에서 음료 주문하기 연습',
      },
      intermediate: {
        listening: '뉴스 헤드라인 듣고 이해하기 (10분)',
        reading: '영어 뉴스 기사 1개 읽기',
        writing: '이메일 작성 연습',
        speaking: '레스토랑 예약 상황극',
      },
      advanced: {
        listening: 'TED Talk 영상 듣기 (15분)',
        reading: '사설/칼럼 분석하기',
        writing: '의견 에세이 작성',
        speaking: '비즈니스 프레젠테이션 연습',
      },
    };
    return plans[level];
  }

  getLevelDescription(level: UserLevel): string {
    const descriptions: Record<UserLevel, string> = {
      beginner: '초급 - 기초 문법과 일상 표현을 배우는 단계',
      intermediate: '중급 - 다양한 상황에서 의사소통이 가능한 단계',
      advanced: '고급 - 전문적인 주제로 토론할 수 있는 단계',
    };
    return descriptions[level];
  }
}

export default new CoordinatorService();
