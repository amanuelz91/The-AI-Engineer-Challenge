"use client";

/**
 * Main chat interface component
 */

import { useState, useRef, useEffect } from "react";
import { Message, ChatState } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { ChatApiService } from "@/services/chatApi";
import { generateMessageId, storage } from "@/lib/utils";
import { Send, Trash2, Settings } from "lucide-react";

export function ChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isTyping: false,
  });

  const [inputMessage, setInputMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [developerMessage, setDeveloperMessage] = useState(
    "You are a helpful AI assistant. Please provide clear, concise, and accurate responses."
  );
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    const savedMessages = storage.getChatHistory();
    if (savedMessages.length > 0) {
      setChatState((prev) => ({
        ...prev,
        messages: savedMessages.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    }

    // Load API key from localStorage if available
    const savedApiKey = localStorage.getItem("openai-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isTyping]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (chatState.messages.length > 0) {
      storage.saveChatHistory(chatState.messages);
    }
  }, [chatState.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !apiKey.trim()) {
      if (!apiKey.trim()) {
        alert("Please enter your OpenAI API key in settings");
        setShowSettings(true);
      }
      return;
    }

    const userMessage: Message = {
      id: generateMessageId(),
      content: inputMessage.trim(),
      role: "user",
      timestamp: new Date(),
    };

    // Add user message and clear input
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      isTyping: true,
    }));

    setInputMessage("");

    // Create assistant message that will be updated with streaming content
    const assistantMessageId = generateMessageId();
    let assistantContent = "";

    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }));

    try {
      await ChatApiService.sendMessage(
        {
          developer_message: developerMessage,
          user_message: userMessage.content,
          api_key: apiKey,
          model: "gpt-4o-mini",
        },
        // onChunk
        (chunk: string) => {
          assistantContent += chunk;
          setChatState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            ),
          }));
        },
        // onComplete
        () => {
          setChatState((prev) => ({
            ...prev,
            isLoading: false,
            isTyping: false,
          }));
        },
        // onError
        (error: string) => {
          setChatState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: `Error: ${error}` }
                : msg
            ),
            isLoading: false,
            isTyping: false,
          }));
        }
      );
    } catch (error) {
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Error: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              }
            : msg
        ),
        isLoading: false,
        isTyping: false,
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChatHistory = () => {
    setChatState((prev) => ({
      ...prev,
      messages: [],
    }));
    storage.clearChatHistory();
  };

  const saveApiKey = () => {
    localStorage.setItem("openai-api-key", apiKey);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          AI Chat Assistant
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={clearChatHistory}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear chat history"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-3">Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-yellow-700 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-yellow-700 mb-1">
                System Message
              </label>
              <textarea
                value={developerMessage}
                onChange={(e) => setDeveloperMessage(e.target.value)}
                placeholder="Enter system/developer message"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              />
            </div>
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {chatState.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-lg font-medium mb-2">Welcome to AI Chat!</p>
              <p className="text-sm">
                Start a conversation by typing a message below.
              </p>
              {!apiKey && (
                <p className="text-xs text-red-500 mt-2">
                  Don&apos;t forget to set your OpenAI API key in settings ⚙️
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {chatState.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {chatState.isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-32"
                style={{
                  height: "auto",
                  minHeight: "48px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px";
                }}
                disabled={chatState.isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={chatState.isLoading || !inputMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
