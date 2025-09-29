"use client";

/**
 * Topic selector component for generating questions
 */

import { useState } from "react";
import { topics } from "@/lib/topics";
import { Search, BookOpen, Settings2, HelpCircle } from "lucide-react";

interface TopicSelectorProps {
  onTopicSelect: (topic: string) => void;
  onGenerateQuestions: (config: QuestionConfig) => void;
  isGenerating?: boolean;
}

export interface QuestionConfig {
  topic: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  questionTypes: string[];
  pdfId?: string;
}

export function TopicSelector({ onTopicSelect, onGenerateQuestions, isGenerating = false }: TopicSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [questionCount, setQuestionCount] = useState(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionTypes, setQuestionTypes] = useState<string[]>(["factual", "analytical"]);

  // Filter topics based on search term
  const filteredTopics = topics.filter(topic =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    onTopicSelect(topic);
    setShowConfig(true);
  };

  const handleGenerateQuestions = () => {
    if (!selectedTopic) return;

    const config: QuestionConfig = {
      topic: selectedTopic,
      questionCount,
      difficulty,
      questionTypes,
    };

    onGenerateQuestions(config);
  };

  // Removed handleQuestionTypeToggle as question types are now fixed

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Select Topic</h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search topics... (e.g., 'firearm', 'assault', 'theft')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Topic List */}
      {!selectedTopic && (
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
          {filteredTopics.length > 0 ? (
            <div className="grid grid-cols-1 gap-1 p-1">
              {filteredTopics.slice(0, 30).map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicSelect(topic)}
                  className="text-left p-2 hover:bg-blue-50 hover:text-blue-700 rounded-md text-xs transition-colors duration-150"
                >
                  {topic}
                </button>
              ))}
              {filteredTopics.length > 30 && (
                <div className="p-2 text-xs text-gray-500 text-center">
                  Showing first 30. Use search to narrow down.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500 text-xs">
              No topics found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      )}

      {/* Selected Topic & Configuration */}
      {selectedTopic && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Selected Topic:</h3>
              <p className="text-blue-600 text-sm">{selectedTopic}</p>
            </div>
            <button
              onClick={() => {
                setSelectedTopic("");
                setShowConfig(false);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Change Topic
            </button>
          </div>

          {showConfig && (
            <div className="space-y-3 bg-gray-50 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Settings2 className="h-3 w-3 text-gray-600" />
                <h4 className="text-xs font-medium text-gray-800">Configuration</h4>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full p-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 Question</option>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <div className="flex gap-1">
                  {["easy", "medium", "hard"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level as "easy" | "medium" | "hard")}
                      className={`px-2 py-1 rounded text-xs capitalize flex-1 ${
                        difficulty === level
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating || questionTypes.length === 0}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium ${
                  isGenerating || questionTypes.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <HelpCircle className="h-3 w-3" />
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Search and select a legal topic from {topics.length.toLocaleString()} available topics</li>
              <li>• Configure question difficulty and types</li>
              <li>• Questions will be generated using AI based on your selection</li>
              <li>• If you have uploaded PDFs, questions will use that context</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
