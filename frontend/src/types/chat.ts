/**
 * Chat-related type definitions for the chat interface
 */

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatRequest {
  developer_message: string;
  user_message: string;
  model?: string;
  api_key: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
}
