/**
 * API service for communicating with the FastAPI chat backend
 */

import { ChatRequest } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ChatApiService {
  /**
   * Send a chat message and receive a streaming response
   * @param request - The chat request payload
   * @param onChunk - Callback function to handle each chunk of the response
   * @param onComplete - Callback function when the stream is complete
   * @param onError - Callback function to handle errors
   */
  static async sendMessage(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining content in the buffer
          if (buffer.trim()) {
            onChunk(buffer);
          }
          onComplete();
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete chunks (you might want to adjust this based on your streaming format)
        onChunk(chunk);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  /**
   * Check if the API is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
