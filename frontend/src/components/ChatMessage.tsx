/**
 * Individual chat message component
 */

import { useState } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { HelpCircle, RefreshCw } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRegenerateQuestions?: () => void;
  isRegenerating?: boolean;
}

export function ChatMessage({ message, onRegenerateQuestions, isRegenerating }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isQuestions = message.role === 'questions';
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));

    setShowResults((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  };

  if (isQuestions && message.questions) {
    return (
      <div className="flex w-full mb-4 justify-start">
        <div className="max-w-[90%] bg-green-50 border border-green-200 rounded-2xl rounded-bl-md p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-800">Multiple Choice Questions</h3>
            </div>
            {onRegenerateQuestions && (
              <button
                onClick={onRegenerateQuestions}
                disabled={isRegenerating}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  isRegenerating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
                {isRegenerating ? "..." : "New"}
              </button>
            )}
          </div>

          {/* Topic Info */}
          <div className="bg-white rounded p-3 mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{message.topic}</span>
              <span
                className={`ml-2 capitalize px-2 py-0.5 rounded text-xs ${
                  message.difficulty === "easy"
                    ? "bg-green-100 text-green-700"
                    : message.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.difficulty}
              </span>
            </div>
            {message.has_context && (
              <div className="text-xs text-green-600 mt-1">✓ Using PDF context</div>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {message.questions.map((question, questionIndex) => (
              <div
                key={questionIndex}
                className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                    {questionIndex + 1}
                  </span>
                  <p className="text-sm text-gray-800 leading-relaxed flex-1">
                    {question.question}
                  </p>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2 ml-8">
                  {question.choices.map((choice, choiceIndex) => {
                    const isSelected = selectedAnswers[questionIndex] === choiceIndex;
                    const isCorrect = choiceIndex === question.correct_answer;
                    const showResult = showResults[questionIndex];

                    let buttonClass = "w-full text-left p-3 rounded-md text-sm border transition-colors ";

                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-100 border-green-500 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += "bg-gray-50 border-gray-300 text-gray-600";
                      }
                    } else {
                      buttonClass += "border-gray-300 hover:bg-gray-50 text-gray-700 cursor-pointer";
                    }

                    return (
                      <button
                        key={choiceIndex}
                        onClick={() => handleAnswerSelect(questionIndex, choiceIndex)}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + choiceIndex)}.
                        </span>
                        {choice}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResults[questionIndex] && (
                  <div className="ml-8 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    );
  }

  // Regular chat message
  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] px-4 py-3 rounded-2xl break-words',
        isUser 
          ? 'bg-blue-600 text-white rounded-br-md' 
          : 'bg-gray-100 text-gray-900 rounded-bl-md'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p className={cn(
          'text-xs mt-2 opacity-70',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}
