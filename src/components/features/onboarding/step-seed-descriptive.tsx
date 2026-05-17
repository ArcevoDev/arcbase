"use client";

import React, { useState } from "react";
import { FolderPlus, Tag } from "lucide-react";

interface StepSeedProps {
  onComplete: (data: { topics: string[]; firstFolder: string }) => void;
  isLoading: boolean;
}

export function StepSeedDescriptive({ onComplete, isLoading }: StepSeedProps) {
  const [folderTitle, setFolderTitle] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const availableTopics = ["Architecture", "Next.js 15", "Prisma ORM", "Database Engineering", "UI Components", "AI Orchestration"];

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderTitle.trim()) return;
    onComplete({ topics: selectedTopics, firstFolder: folderTitle.trim() });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Launch Your First Repository</h3>
        <p className="text-sm text-gray-500">We hate blank pages. Name your first curation binder folder now to instantly jumpstart your system dashboard metrics context.</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">
          <FolderPlus className="w-3.5 h-3.5 text-gray-400" />
          <span>Folder Name</span>
        </div>
        <input
          type="text"
          required
          placeholder="e.g., Advanced System Design Mappings"
          value={folderTitle}
          onChange={(e) => setFolderTitle(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder-gray-400"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span>Follow Initial Category Tags</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableTopics.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => handleToggleTopic(topic)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition focus:outline-none border ${
                  isSelected 
                    ? "bg-blue-50 border-blue-300 text-blue-700" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                disabled={isLoading}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !folderTitle.trim()}
        className="w-full rounded-md bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition disabled:bg-gray-200 disabled:cursor-not-allowed mt-4"
      >
        {isLoading ? "Provisioning System Infrastructure..." : "Launch Platform Dashboard"}
      </button>
    </form>
  );
}
