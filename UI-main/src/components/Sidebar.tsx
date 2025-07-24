import React, { useState } from 'react';
import { Search, Video, Code, Image, TrendingUp, TestTube, X } from 'lucide-react';

const tools = [
  { id: 'search', label: 'AI Powered Search', icon: Search },
  { id: 'video', label: 'Video Summarizer', icon: Video },
  { id: 'code', label: 'Code Assistant', icon: Code },
  { id: 'image', label: 'Image Insights', icon: Image },
  { id: 'impact', label: 'Impact Analyzer', icon: TrendingUp },
  { id: 'test', label: 'Test Support Tool', icon: TestTube },
];

const toolDescriptions: Record<string, string> = {
  search: 'Search and analyze Confluence content with AI',
  video: 'Summarize and extract insights from video content',
  code: 'Get code assistance and suggestions',
  image: 'Analyze images and build charts',
  impact: 'Analyze the impact of changes',
  test: 'Support for testing and QA tasks',
};

interface SidebarProps {
  onToolSelect: (toolId: string) => void;
  onClose: () => void;
  isOpen: boolean;
  activeTool: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onToolSelect, onClose, isOpen, activeTool }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed left-0 top-0 h-full z-50 flex flex-col bg-white/90 shadow-lg border-r border-gray-200 w-16 items-center pt-4">
      <button onClick={onClose} className="mb-6 p-2 rounded hover:bg-gray-200 transition-colors">
        <X className="w-6 h-6 text-gray-500" />
      </button>
      <div className="flex flex-col gap-4 items-center w-full">
        {tools.map(({ id, label, icon: Icon }) => (
          <div key={id} className="relative group w-full flex flex-col items-center">
            <button
              onClick={() => onToolSelect(id)}
              className={`p-2 rounded-lg flex items-center justify-center w-12 h-12 transition-colors ${activeTool === id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Icon className="w-6 h-6 text-gray-700" />
            </button>
            <span className="mt-1 text-xs text-gray-700 cursor-pointer group-hover:underline relative">
              {label}
              {/* Tooltip for feature description */}
              <span className="absolute left-1/2 -translate-x-1/2 top-7 z-50 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {toolDescriptions[id]}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 