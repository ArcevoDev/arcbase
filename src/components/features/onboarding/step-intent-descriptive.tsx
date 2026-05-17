"use client";

import React from "react";
import { Compass, Lightbulb, Workflow } from "lucide-react";

interface IntentOption {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export function StepIntentDescriptive({ onNext }: { onNext: (data: { intent: string }) => void }) {
  const options: IntentOption[] = [
    {
      key: "EXPLORE_KNOWLEDGE",
      title: "Explore Knowledge & Systems",
      desc: "I want to browse public digital libraries, explore structural technical document tracks, and consume shared resources across the platform ecosystem.",
      icon: <Compass className="w-5 h-5 text-blue-600" />
    },
    {
      key: "CONDUCT_RESEARCH",
      title: "Conduct Deep Academic Research",
      desc: "I need to manage research data logs, track strict chronological text version changes, audit layout histories, and maintain an absolute record of my workspace nodes.",
      icon: <Lightbulb className="w-5 h-5 text-indigo-600" />
    },
    {
      key: "STRUCTURE_RESOURCES",
      title: "Structure Creator Resources",
      desc: "I plan to curate organized folder collections, build interactive code playgrounds, and wire up horizontal graph link maps to chart prereqs or citations.",
      icon: <Workflow className="w-5 h-5 text-emerald-600" />
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Define Your Platform Goal</h3>
        <p className="text-sm text-gray-500">How do you primarily plan to utilize ArcBase? We will configure your main workspace panels to match this intent.</p>
      </div>
      <div className="space-y-2.5">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onNext({ intent: opt.key })}
            className="w-full text-left flex items-start p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 group shadow-sm"
          >
            <div className="p-2 rounded-md bg-gray-50 group-hover:bg-white border border-gray-100 mr-3.5 mt-0.5 transition-colors">
              {opt.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{opt.title}</div>
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
