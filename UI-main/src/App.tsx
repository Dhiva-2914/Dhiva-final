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
        <div>
          {!appMode ? (
            <ModeSelector onModeSelect={handleModeSelect} onClose={handleAppClose} />
          ) : appMode === 'agent' ? (
            <AgentMode onClose={handleAppClose} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
          ) : appMode === 'tool' && (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-40 p-4">
              <div className="bg-white/80 backdrop-blur-xl border-2 border-[#DFE1E6] rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-row">
                {/* Sidebar */}
                {isSidebarOpen ? (
                  <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onToolSelect={(toolId) => setActiveTool(toolId)}
                    activeTool={activeTool}
                  />
                ) : (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="m-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 shadow"
                    style={{ minWidth: 40 }}
                  >
                    <span className="sr-only">Open Sidebar</span>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu text-gray-500"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  </button>
                )}
                {/* Tool Content */}
                <div className="flex-1 overflow-y-auto">
                  {activeTool === 'search' && (
                    <AIPoweredSearch onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
                  )}
                  {activeTool === 'video' && (
                    <VideoSummarizer onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
                  )}
                  {activeTool === 'code' && (
                    <CodeAssistant onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
                  )}
                  {activeTool === 'impact' && (
                    <ImpactAnalyzer onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
                  )}
                  {activeTool === 'test' && (
                    <TestSupportTool onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
                  )}
                  {activeTool === 'image' && (
                    <ImageInsights onClose={handleAppClose} onFeatureSelect={setActiveFeature} onModeSelect={setAppMode} autoSpaceKey={autoSpaceKey} isSpaceAutoConnected={!!autoSpaceKey} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;