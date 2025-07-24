import React from 'react';
import { Search, Video, Code, Image, TrendingUp, TestTube, X } from 'lucide-react';
import { FeatureType } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: FeatureType) => void;
  activeFeature: FeatureType;
}

const features = [
  { id: 'search', label: 'AI Powered Search', icon: Search },
  { id: 'video', label: 'Video Summarizer', icon: Video },
  { id: 'code', label: 'Code Assistant', icon: Code },
  { id: 'image', label: 'Image Insights', icon: Image },
  { id: 'impact', label: 'Impact Analyzer', icon: TrendingUp },
  { id: 'test', label: 'Test Support Tool', icon: TestTube },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onFeatureSelect, activeFeature }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white/90 shadow-lg z-50 flex flex-col items-center py-4 border-r border-gray-200">
      <button onClick={onClose} className="mb-6 p-2 rounded hover:bg-gray-100">
        <X className="w-6 h-6 text-gray-500" />
      </button>
      {features.map((feature) => {
        const Icon = feature.icon;
        const isActive = activeFeature === feature.id;
        return (
          <div key={feature.id} className="mb-4 group flex flex-col items-center">
            <button
              onClick={() => onFeatureSelect(feature.id as FeatureType)}
              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            </button>
            <span className="absolute left-16 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 ml-2 pointer-events-none whitespace-nowrap transition-opacity duration-200">
              {feature.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar; 