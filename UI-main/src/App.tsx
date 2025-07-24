import React, { useState, useEffect } from 'react';
import ModeSelector from './components/ModeSelector';
import AgentMode from './components/AgentMode';
import AIPoweredSearch from './components/AIPoweredSearch';
import VideoSummarizer from './components/VideoSummarizer';
import CodeAssistant from './components/CodeAssistant';
import ImpactAnalyzer from './components/ImpactAnalyzer';
import TestSupportTool from './components/TestSupportTool';
import ImageInsights from './components/ImageInsights';
import CircularLauncher from './components/CircularLauncher';
import Sidebar from './components/Sidebar';

export type FeatureType = 'search' | 'video' | 'code' | 'impact' | 'test' | 'image' | null;
export type AppMode = 'agent' | 'tool' | null;

function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureType>(null);
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [autoSpaceKey, setAutoSpaceKey] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<AppMode>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState('search');

  // Extract space key from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spaceKey = urlParams.get('space');
    if (spaceKey) {
      setAutoSpaceKey(spaceKey);
    }
  }, []);

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'search':
        return <AIPoweredSearch onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
      case 'video':
        return <VideoSummarizer onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
      case 'code':
        return <CodeAssistant onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
      case 'impact':
        return <ImpactAnalyzer onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
      case 'test':
        return <TestSupportTool onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
      case 'image':
        return <ImageInsights onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
      default:
        return <AIPoweredSearch onClose={() => setActiveFeature(null)} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />;
    }
  };

  const handleLauncherClick = () => {
    setIsAppOpen(true);
    // Don't set a default feature, let user choose mode first
  };

  const handleAppClose = () => {
    setIsAppOpen(false);
    setActiveFeature(null);
    setAppMode(null);
  };

  const handleModeSelect = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'tool') {
      setActiveFeature('search'); // Default to search for tool mode
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {!isAppOpen && (
        <CircularLauncher onClick={handleLauncherClick} />
      )}
      
      {isAppOpen && (
        <div className="relative w-full max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border-2 border-[#DFE1E6] rounded-2xl flex min-h-[80vh] overflow-hidden">
          {/* Sidebar (not fixed, but as a flex child) */}
          {appMode === 'tool' && isSidebarOpen && (
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onToolSelect={(toolId) => setActiveTool(toolId)}
              activeTool={activeTool}
            />
          )}
          <div className="flex-1 flex flex-col">
            {/* Sidebar open/close button */}
            {appMode === 'tool' && !isSidebarOpen && (
              <button
                className="absolute left-0 top-4 z-10 bg-gray-200 hover:bg-gray-300 rounded-r-lg px-2 py-1 text-xs text-gray-700 shadow"
                onClick={() => setIsSidebarOpen(true)}
              >
                Open Sidebar
              </button>
            )}
            {/* Main content */}
            {!appMode ? (
              <ModeSelector onModeSelect={handleModeSelect} onClose={handleAppClose} />
            ) : appMode === 'agent' ? (
              <AgentMode onClose={handleAppClose} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            ) : null}
            {appMode === 'tool' && activeTool === 'search' && (
              <AIPoweredSearch onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            )}
            {appMode === 'tool' && activeTool === 'video' && (
              <VideoSummarizer onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            )}
            {appMode === 'tool' && activeTool === 'code' && (
              <CodeAssistant onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            )}
            {appMode === 'tool' && activeTool === 'impact' && (
              <ImpactAnalyzer onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            )}
            {appMode === 'tool' && activeTool === 'test' && (
              <TestSupportTool onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            )}
            {appMode === 'tool' && activeTool === 'image' && (
              <ImageInsights onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;