/**
 * API service for communicating with the FastAPI chat backend
 */

import { ChatRequest, UploadedPDF, PDFListItem } from "@/types/chat";

export interface QuestionGenerationRequest {
  topic: string;
  pdf_id?: string;
  question_count?: number;
  difficulty?: "easy" | "medium" | "hard";
  question_types?: string[];
  api_key: string;
  model?: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  choices: string[];
  correct_answer: number;
  explanation: string;
}

export interface GeneratedQuestions {
  topic: string;
  questions: MultipleChoiceQuestion[];
  difficulty: string;
  question_types: string[];
  has_context: boolean;
  context_chunks_used: number;
}

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8000/api";

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
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

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
      onError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  }

  /**
   * Upload a PDF file for RAG functionality
   * @param file - The PDF file to upload
   * @param apiKey - OpenAI API key
   */
  static async uploadPDF(file: File, apiKey: string): Promise<UploadedPDF> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);

    const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get list of uploaded PDFs
   */
  static async listPDFs(): Promise<PDFListItem[]> {
    const response = await fetch(`${API_BASE_URL}/pdfs`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.pdfs;
  }

  /**
   * Delete a PDF from the server
   * @param pdfId - The ID of the PDF to delete
   */
  static async deletePDF(pdfId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pdfs/${pdfId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }
  }

  /**
   * Generate questions based on a topic
   * @param request - The question generation request payload
   */
  static async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestions> {
    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Check if the API is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === "ok";
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}
