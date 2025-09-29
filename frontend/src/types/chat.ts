/**
 * Chat-related type definitions for the chat interface
 */

export interface MultipleChoiceQuestion {
  question: string;
  choices: string[];
  correct_answer: number;
  explanation: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'questions';
  timestamp: Date;
  // Optional fields for multiple choice questions
  questions?: MultipleChoiceQuestion[];
  topic?: string;
  difficulty?: string;
  question_types?: string[];
  has_context?: boolean;
  context_chunks_used?: number;
}

export interface ChatRequest {
  developer_message: string;
  user_message: string;
  model?: string;
  api_key: string;
  pdf_id?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
}

export interface UploadedPDF {
  pdf_id: string;
  filename: string;
  chunks_count: number;
  message: string;
}

export interface PDFListItem {
  pdf_id: string;
  chunks_count: number;
}
