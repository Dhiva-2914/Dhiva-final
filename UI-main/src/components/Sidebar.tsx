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
  search: 'Search Confluence pages with AI-powered queries.',
  video: 'Summarize and analyze video content from your pages.',
  code: 'Get code assistance and suggestions for your documentation.',
  image: 'Extract insights and build charts from images.',
  impact: 'Analyze the impact of changes between pages.',
  test: 'Generate and support test strategies for your code.',
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
        {tools.map(({ id, label, icon: Icon }) => {
          const [showDesc, setShowDesc] = useState(false);
          return (
            <div key={id} className="relative group w-full flex flex-col items-center justify-center">
              <button
                onClick={() => onToolSelect(id)}
                className={`p-2 rounded-lg flex items-center justify-center w-12 h-12 transition-colors ${activeTool === id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                onMouseEnter={() => setShowDesc(true)}
                onMouseLeave={() => setShowDesc(false)}
              >
                <Icon className="w-6 h-6 text-gray-700" />
              </button>
              <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                {label}
              </span>
              {/* Show description below the name on hover */}
              {showDesc && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 mt-8 bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-xs text-gray-700 z-50 w-48">
                  {toolDescriptions[id]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar; 