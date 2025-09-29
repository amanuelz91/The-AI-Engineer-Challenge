"use client";

/**
 * Component to display generated questions
 */

import { useState } from "react";
import {
  HelpCircle,
  RefreshCw,
} from "lucide-react";

export interface MultipleChoiceQuestion {
  question: string;
  choices: string[];
  correct_answer: number;
  explanation: string;
}

export interface GeneratedQuestion {
  topic: string;
  questions: MultipleChoiceQuestion[];
  difficulty: string;
  question_types: string[];
  has_context: boolean;
  context_chunks_used: number;
}

interface QuestionDisplayProps {
  generatedQuestions: GeneratedQuestion | null;
  onAskQuestion: (question: string) => void;
  onRegenerateQuestions: () => void;
  isRegenerating?: boolean;
}

export function QuestionDisplay({
  generatedQuestions,
  onAskQuestion: _onAskQuestion, // Renamed to indicate it's unused
  onRegenerateQuestions,
  isRegenerating = false,
}: QuestionDisplayProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState<{[key: number]: boolean}>({});

  if (!generatedQuestions) {
    return null;
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
    
    setShowResults(prev => ({
      ...prev,
      [questionIndex]: true
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-800">Questions</h3>
        </div>
        <button
          onClick={onRegenerateQuestions}
          disabled={isRegenerating}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            isRegenerating
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <RefreshCw
            className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`}
          />
          {isRegenerating ? "..." : "New"}
        </button>
      </div>

      {/* Topic Info */}
      <div className="bg-gray-50 rounded p-2">
        <div className="text-xs text-gray-600">
          <span className="font-medium">{generatedQuestions.topic}</span>
          <span className={`ml-2 capitalize px-1 py-0.5 rounded text-xs ${
            generatedQuestions.difficulty === "easy"
              ? "bg-green-100 text-green-700"
              : generatedQuestions.difficulty === "medium"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}>
            {generatedQuestions.difficulty}
          </span>
        </div>
        {generatedQuestions.has_context && (
          <div className="text-xs text-green-600 mt-1">
            ✓ Using PDF context
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {generatedQuestions.questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            className="border border-gray-200 rounded-lg p-3 space-y-3"
          >
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded">
                {questionIndex + 1}
              </span>
              <p className="text-xs text-gray-800 leading-relaxed flex-1">
                {question.question}
              </p>
            </div>
            
            {/* Multiple Choice Options */}
            <div className="space-y-2 ml-6">
              {question.choices.map((choice, choiceIndex) => {
                const isSelected = selectedAnswers[questionIndex] === choiceIndex;
                const isCorrect = choiceIndex === question.correct_answer;
                const showResult = showResults[questionIndex];
                
                let buttonClass = "w-full text-left p-2 rounded text-xs border transition-colors ";
                
                if (showResult) {
                  if (isCorrect) {
                    buttonClass += "bg-green-100 border-green-500 text-green-800";
                  } else if (isSelected && !isCorrect) {
                    buttonClass += "bg-red-100 border-red-500 text-red-800";
                  } else {
                    buttonClass += "bg-gray-50 border-gray-300 text-gray-600";
                  }
                } else {
                  buttonClass += "border-gray-300 hover:bg-gray-50 text-gray-700";
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
              <div className="ml-6 p-2 bg-blue-50 rounded text-xs text-blue-800">
                <span className="font-medium">Explanation:</span> {question.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
