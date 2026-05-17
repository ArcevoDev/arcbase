"use client";

import React from "react";
import { Code2, GraduationCap, Microscope, PenTool, Layers } from "lucide-react";

interface RoleOption {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export function StepRoleDescriptive({ onNext }: { onNext: (data: { occupation: string }) => void }) {
  const options: RoleOption[] = [
    { key: "DEVELOPER", title: "Software Engineer / Architect", desc: "Assembling structural modules, data layer contracts, and debugging software execution trees.", icon: <Code2 className="w-5 h-5 text-indigo-600" /> },
    { key: "EDUCATOR", title: "Instructor / Academic Curator", desc: "Organizing knowledge syllabus guides, tracking lecture syllabi, and distributing learning assets.", icon: <GraduationCap className="w-5 h-5 text-purple-600" /> },
    { key: "RESEARCHER", title: "Data Analyst / Scientist", desc: "Compiling research files, document references, and long-form information lookup records.", icon: <Microscope className="w-5 h-5 text-emerald-600" /> },
    { key: "WRITER", title: "Technical Writer / Content Creator", desc: "Drafting user documentation pipelines, publishing articles, and building technical copy grids.", icon: <PenTool className="w-5 h-5 text-amber-600" /> },
    { key: "CURATOR", title: "General Knowledge Collector", desc: "Aggregating scattered ecosystem URLs, bookmarking learning paths, and building asset indexes.", icon: <Layers className="w-5 h-5 text-rose-600" /> }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center md:text-left">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Define Your Core Focus Profile</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Select the operational identity that best describes your daily content creation goals. This choices will personalize your initial dashboard layouts.
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onNext({ occupation: opt.key })}
            className="w-full text-left flex items-start p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 group transition-all duration-150 shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-indigo-50/50 border border-gray-100 group-hover:border-indigo-100 mr-4 mt-0.5 transition-colors duration-150 shrink-0">
              {opt.icon}
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{opt.title}</div>
              <div className="text-xs text-gray-400 font-normal leading-relaxed">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
