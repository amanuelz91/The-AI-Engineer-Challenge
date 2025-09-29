/**
 * Utility functions for the application
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Message } from '@/types/chat';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique ID for messages
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Local storage utilities for chat history
 */
export const storage = {
  getChatHistory: (): Message[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('chat-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  
  saveChatHistory: (messages: Message[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  },
  
  clearChatHistory: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('chat-history');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }
};
