export interface CreateQuestionInput {
  prompt: string;
  answer: number;
  position?: number;
}

export interface UpdateQuestionInput {
  prompt?: string;
  answer?: number;
  position?: number;
}

export interface QuestionRow {
  id: string;
  event_id: string;
  position: number;
  prompt: string;
  answer: string;
  created_at: string;
}
