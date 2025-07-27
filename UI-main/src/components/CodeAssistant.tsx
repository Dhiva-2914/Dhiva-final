import React, { useState, useEffect } from 'react';
import { Code, FileText, Download, Save, X, ChevronDown, Loader2, Zap, Search, Video, TrendingUp, TestTube, Image, GitCompare } from 'lucide-react';
import { FeatureType, AppMode } from '../App';
import { apiService, Space } from '../services/api';
import CustomScrollbar from './CustomScrollbar';
import { getConfluenceSpaceAndPageFromUrl } from '../utils/urlUtils';

interface CodeAssistantProps {
  onClose: () => void;
  onFeatureSelect: (feature: FeatureType) => void;
  onModeSelect: (mode: AppMode) => void;
  autoSpaceKey?: string | null;
  isSpaceAutoConnected?: boolean;
}

interface DiffMetrics {
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  percentageChanged: number;
}

interface RiskLevel {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
}

const CodeAssistant: React.FC<CodeAssistantProps> = ({ onClose, onFeatureSelect, onModeSelect, autoSpaceKey, isSpaceAutoConnected }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [detectedCode, setDetectedCode] = useState('');
  const [instruction, setInstruction] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [fileName, setFileName] = useState('');
  const [processedCode, setProcessedCode] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Add new state for AI Action and outputs
  const [aiAction, setAiAction] = useState('');
  const [aiActionOutput, setAiActionOutput] = useState('');
  const [modificationOutput, setModificationOutput] = useState('');
  const [conversionOutput, setConversionOutput] = useState('');

  // Add new state for Impact Analysis
  const [isImpactAnalyzing, setIsImpactAnalyzing] = useState(false);
  const [impactResults, setImpactResults] = useState<string>('');
  const [impactMetrics, setImpactMetrics] = useState<DiffMetrics | null>(null);
  const [impactSummary, setImpactSummary] = useState('');
  const [impactRecommendations, setImpactRecommendations] = useState('');
  const [impactRiskLevel, setImpactRiskLevel] = useState<RiskLevel | null>(null);
  const [showImpactResults, setShowImpactResults] = useState(false);

  const features = [
    { id: 'search' as const, label: 'AI Powered Search', icon: Search },
    { id: 'video' as const, label: 'Video Summarizer', icon: Video },
    { id: 'code' as const, label: 'Code Assistant', icon: Code },
    { id: 'impact' as const, label: 'Impact Analyzer', icon: TrendingUp },
    { id: 'test' as const, label: 'Test Support Tool', icon: TestTube },
    { id: 'image' as const, label: 'Image Insights & Chart Builder', icon: Image },
  ];

  // Update outputFormats to include all from dhiva
  const outputFormats = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'yang', 'cpp', 'c', 'swift', 'kotlin', 'scala', 'ruby', 'perl', 'bash', 'powershell', 'sql', 'html', 'css', 'xml', 'json', 'yaml', 'toml'
  ];

  // Add AI Actions catalog
  const aiActions = [
    'Select action...',
    'Optimize Performance',
    'Generate Documentation',
    'Refactor Structure',
    'Identify dead code',
    'Add Logging Statements'
  ];

  // Load spaces on component mount
  useEffect(() => {
    loadSpaces();
  }, []);

  // Auto-select space if provided via URL
  useEffect(() => {
    if (autoSpaceKey && isSpaceAutoConnected) {
      setSelectedSpace(autoSpaceKey);
    }
  }, [autoSpaceKey, isSpaceAutoConnected]);

  // Load pages when space is selected
  useEffect(() => {
    if (selectedSpace) {
      loadPages();
    }
  }, [selectedSpace]);

  const loadSpaces = async () => {
    try {
      setError('');
      const result = await apiService.getSpaces();
      setSpaces(result.spaces);
    } catch (err) {
      setError('Failed to load spaces. Please check your backend connection.');
      console.error('Error loading spaces:', err);
    }
  };

  const loadPages = async () => {
    try {
      setError('');
      const result = await apiService.getPages(selectedSpace);
      setPages(result.pages);
      // Auto-select page if present in URL
      const { page } = getConfluenceSpaceAndPageFromUrl();
      if (page && result.pages.includes(page)) {
        setSelectedPage(page);
      }
    } catch (err) {
      setError('Failed to load pages. Please check your space key.');
      console.error('Error loading pages:', err);
    }
  };

  const handlePageSelect = async (pageTitle: string) => {
    setSelectedPage(pageTitle);
    setIsProcessing(true);
    setError('');

    try {
      const result = await apiService.codeAssistant({
        space_key: selectedSpace,
        page_title: pageTitle,
        instruction: ''
      });

      setDetectedCode(result.original_code);
      setSummary(result.summary);
      setProcessedCode('');
      // Reset impact analysis results when page changes
      setShowImpactResults(false);
      setImpactResults('');
      setImpactMetrics(null);
      setImpactSummary('');
      setImpactRecommendations('');
      setImpactRiskLevel(null);
    } catch (err) {
      setError('Failed to load page content. Please try again.');
      console.error('Error loading page:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add impact analysis function
  const analyzeImpact = async () => {
    if (!selectedSpace || !selectedPage || !detectedCode) {
      setError('Please select a space and page with code content.');
      return;
    }

    // Get the current modified code (prioritize the most recent output)
    const newCode = aiActionOutput || modificationOutput || conversionOutput || processedCode;
    
    if (!newCode || newCode === detectedCode) {
      setError('No changes detected to analyze impact.');
      return;
    }

    setIsImpactAnalyzing(true);
    setError('');

    try {
      // Create a custom impact analysis by directly comparing the codes
      const oldLines = detectedCode.split('\n');
      const newLines = newCode.split('\n');
      
      // Calculate basic metrics
      const linesAdded = Math.max(0, newLines.length - oldLines.length);
      const linesRemoved = Math.max(0, oldLines.length - newLines.length);
      const totalLines = Math.max(oldLines.length, newLines.length);
      const percentageChange = totalLines > 0 ? Math.round(((linesAdded + linesRemoved) / totalLines) * 100) : 0;
      
      // Generate a simple diff-like output
      const diffOutput = [];
      const maxLines = Math.max(oldLines.length, newLines.length);
      
      for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i] || '';
        const newLine = newLines[i] || '';
        
        if (oldLine !== newLine) {
          if (oldLine) diffOutput.push(`- ${oldLine}`);
          if (newLine) diffOutput.push(`+ ${newLine}`);
        } else {
          diffOutput.push(`  ${oldLine}`);
        }
      }
      
      // Use the Code Assistant API to generate impact analysis
      const analysisPrompt = `Analyze the impact of the following code changes. Provide a detailed analysis in this exact format:

## Impact Analysis
[Describe what was changed and how it affects the codebase]

## Risk Assessment
[Identify potential risks and their severity levels]

## Recommendations
[Provide specific suggestions for improvement, testing, or deployment]

Original Code:
${detectedCode}

Modified Code:
${newCode}

Please provide a structured analysis with clear sections as specified above.`;

      const analysisResult = await apiService.codeAssistant({
        space_key: selectedSpace,
        page_title: selectedPage,
        instruction: analysisPrompt
      });

      // Calculate risk level based on percentage change
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      let riskScore = 1;
      
      if (percentageChange > 30) {
        riskLevel = 'high';
        riskScore = Math.min(10, Math.round(percentageChange / 10));
      } else if (percentageChange > 10) {
        riskLevel = 'medium';
        riskScore = Math.min(8, Math.round(percentageChange / 8));
      } else {
        riskLevel = 'low';
        riskScore = Math.min(5, Math.round(percentageChange / 5));
      }

      // Generate risk factors based on the analysis
      const riskFactors = [
        `Code changes affect ${percentageChange}% of the original content`,
        `${linesAdded} lines added, ${linesRemoved} lines removed`,
        'Changes may impact functionality and require testing',
        'Review recommended before deployment'
      ];

      setImpactResults(diffOutput.join('\n'));
      setImpactMetrics({
        linesAdded: linesAdded,
        linesRemoved: linesRemoved,
        filesChanged: 1,
        percentageChanged: percentageChange
      });
      
      const analysisText = analysisResult.modified_code || analysisResult.original_code || 'Impact analysis completed successfully.';
      setImpactSummary(analysisText);
      
      // Extract recommendations if they exist in the analysis
      const recommendationsMatch = analysisText.match(/## Recommendations\n([\s\S]*?)(?=\n##|$)/);
      if (recommendationsMatch) {
        setImpactRecommendations(recommendationsMatch[1].trim());
      } else {
        setImpactRecommendations('');
      }
      
      setImpactRiskLevel({
        level: riskLevel,
        score: riskScore,
        factors: riskFactors
      });
      
      setShowImpactResults(true);
      
    } catch (err) {
      setError('Failed to analyze impact. Please try again.');
      console.error('Error analyzing impact:', err);
    } finally {
      setIsImpactAnalyzing(false);
    }
  };

  // Helper function to get risk color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100/80 backdrop-blur-sm border-green-200/50';
      case 'medium': return 'text-yellow-700 bg-yellow-100/80 backdrop-blur-sm border-yellow-200/50';
      case 'high': return 'text-red-700 bg-red-100/80 backdrop-blur-sm border-red-200/50';
      default: return 'text-gray-700 bg-gray-100/80 backdrop-blur-sm border-gray-200/50';
    }
  };

  // Helper function to get risk icon
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <TrendingUp className="w-5 h-5" />;
      case 'medium': return <TrendingUp className="w-5 h-5" />;
      case 'high': return <TrendingUp className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  // Check if there are any changes to show the Impact Analyze button
  const hasChanges = () => {
    const newCode = aiActionOutput || modificationOutput || conversionOutput || processedCode;
    return newCode && newCode !== detectedCode && detectedCode;
  };

  // Update processCode to handle AI actions and outputs
  const processCode = async () => {
    if (!selectedSpace || !selectedPage) {
      setError('Please select a space and page.');
      return;
    }

    // Clear previous outputs before running a new process
    setAiActionOutput('');
    setConversionOutput('');
    setModificationOutput('');

    // Check if any option is selected
    const hasModificationInstruction = instruction.trim() !== '';
    const hasTargetLanguage = targetLanguage !== '';
    const hasAiAction = aiAction !== '' && aiAction !== 'Select action...';

    if (!hasModificationInstruction && !hasTargetLanguage && !hasAiAction) {
      setError('Please provide a modification instruction, select a target language, or choose an AI action.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // If all three are selected: target language -> modification -> AI action
      if (hasTargetLanguage && hasModificationInstruction && hasAiAction) {
        // 1. Convert code to target language
        const conversionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: '',
          target_language: targetLanguage
        });
        const convertedCode = conversionResult.converted_code || conversionResult.modified_code || conversionResult.original_code || '';
        // 2. Apply modification instruction to converted code
        const modResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: `${instruction}\n\n${convertedCode}`,
          target_language: '',
        });
        const modifiedCode = modResult.modified_code || modResult.converted_code || modResult.original_code || '';
        // 3. Apply AI action to modified code
        const actionPromptMap: Record<string, string> = {
          "Summarize Code": `Summarize the following code in clear and concise language:\n\n${modifiedCode}`,
          "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${modifiedCode}`,
          "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${modifiedCode}`,
          "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${modifiedCode}`,
          "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${modifiedCode}`,
          "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${modifiedCode}`,
        };
        const prompt = actionPromptMap[aiAction];
        if (!prompt) {
          setAiActionOutput('');
          setIsProcessing(false);
          return;
        }
        const actionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: prompt
        });
        setAiActionOutput(actionResult.modified_code || actionResult.converted_code || actionResult.original_code || 'AI action completed successfully.');
        setProcessedCode('');
        return;
      }

      // If modification instruction and target language are selected (but not AI action): target language -> modification
      if (hasTargetLanguage && hasModificationInstruction && !hasAiAction) {
        // 1. Convert code to target language
        const conversionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: '',
          target_language: targetLanguage
        });
        const convertedCode = conversionResult.converted_code || conversionResult.modified_code || conversionResult.original_code || '';
        // 2. Apply modification instruction to converted code
        const modResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: `${instruction}\n\n${convertedCode}`,
          target_language: '',
        });
        setModificationOutput(modResult.modified_code || modResult.converted_code || modResult.original_code || 'Modification completed successfully.');
        setConversionOutput('');
        setAiActionOutput('');
        setProcessedCode('');
        return;
      }

      // If both target language and AI action are selected (but not modification): target language -> AI action
      if (hasTargetLanguage && !hasModificationInstruction && hasAiAction) {
        // 1. Convert code to target language
        const conversionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: '',
          target_language: targetLanguage
        });
        const convertedCode = conversionResult.converted_code || conversionResult.modified_code || conversionResult.original_code || '';
        setConversionOutput('');
        setModificationOutput('');
        // 2. Apply AI action to converted code
        const actionPromptMap: Record<string, string> = {
          "Summarize Code": `Summarize the following code in clear and concise language:\n\n${convertedCode}`,
          "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${convertedCode}`,
          "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${convertedCode}`,
          "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${convertedCode}`,
          "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${convertedCode}`,
          "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${convertedCode}`,
        };
        const prompt = actionPromptMap[aiAction];
        if (!prompt) {
          setAiActionOutput('');
          setIsProcessing(false);
          return;
        }
        const actionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: prompt
        });
        setAiActionOutput(actionResult.modified_code || actionResult.converted_code || actionResult.original_code || 'AI action completed successfully.');
        setProcessedCode('');
        return;
      }

      // If only AI action is selected
      if (hasAiAction) {
        await runAiAction();
      }

      // If only modification instruction or target language is selected, process with API
      if (hasModificationInstruction || hasTargetLanguage) {
        const result = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: instruction,
          target_language: targetLanguage || undefined
        });
        // Show converted code if target language is selected
        if (hasTargetLanguage && result.converted_code) {
          setConversionOutput(result.converted_code);
        } else {
          setConversionOutput('');
        }
        // Show modified code if modification instruction is used
        if (hasModificationInstruction && result.modified_code) {
          setModificationOutput(result.modified_code);
        } else {
          setModificationOutput('');
        }
        // Fallback for legacy processedCode
        if (!hasTargetLanguage && !hasModificationInstruction && result.original_code) {
          setProcessedCode(result.original_code);
        }
      }
    } catch (err) {
      setError('Failed to process code. Please try again.');
      console.error('Error processing code:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add runAiAction helper
  const runAiAction = async () => {
    if (!aiAction || aiAction === 'Select action...' || !detectedCode) {
      return;
    }

    const actionPromptMap: Record<string, string> = {
      "Summarize Code": `Summarize the following code in clear and concise language:\n\n${detectedCode}`,
      "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${detectedCode}`,
      "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${detectedCode}`,
      "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${detectedCode}`,
      "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${detectedCode}`,
      "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${detectedCode}`,
    };

    try {
      const prompt = actionPromptMap[aiAction];
      if (!prompt) return;

      // For now, we'll use the same API service but with a special instruction
      const result = await apiService.codeAssistant({
        space_key: selectedSpace,
        page_title: selectedPage,
        instruction: prompt
      });

      setAiActionOutput(result.modified_code || result.converted_code || result.original_code || 'AI action completed successfully.');
    } catch (err) {
      setError(`Failed to run AI action: ${err}`);
      console.error('Error running AI action:', err);
    }
  };

  // Update exportCode to export any output
  const exportCode = async (format: string) => {
    const content = modificationOutput || conversionOutput || aiActionOutput || processedCode || detectedCode;
    if (!content) return;

    try {
      const blob = await apiService.exportContent({
        content: content,
        format: format,
        filename: fileName || 'code'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'code'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export file. Please try again.');
      console.error('Error exporting:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-40 p-4">
      <div className="bg-white/80 backdrop-blur-xl border-2 border-[#DFE1E6] rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-confluence-blue/90 to-confluence-light-blue/90 backdrop-blur-xl p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Confluence AI Assistant</h2>
                <p className="text-blue-100/90">AI-powered tools for your Confluence workspace</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onModeSelect('agent')}
                className="text-blue-100 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1 text-sm transition-colors"
              >
                Switch to Agent Mode
              </button>
              <button onClick={onClose} className="text-white hover:bg-white/10 rounded-full p-2 backdrop-blur-sm">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Feature Navigation */}
          <div className="mt-6 relative">
            <CustomScrollbar className="pb-2">
              <div className="flex gap-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = feature.id === 'code';
                  
                  return (
                    <button
                      key={feature.id}
                      onClick={() => onFeatureSelect(feature.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-white/90 text-confluence-blue shadow-lg border-white/30'
                          : 'bg-white/10 text-white hover:bg-white/20 border-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </button>
                  );
                })}
              </div>
            </CustomScrollbar>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Configuration
                </h3>
                
                {/* Space Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Confluence Space
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue appearance-none bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Choose a space...</option>
                      {spaces.map(space => (
                        <option key={space.key} value={space.key}>{space.name} ({space.key})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Page Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Code Page
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPage}
                      onChange={(e) => handlePageSelect(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue appearance-none bg-white/70 backdrop-blur-sm"
                      disabled={!selectedSpace}
                    >
                      <option value="">Choose a page...</option>
                      {pages.map(page => (
                        <option key={page} value={page}>{page}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* AI Actions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Actions
                  </label>
                  <div className="relative">
                    <select
                      value={aiAction}
                      onChange={(e) => setAiAction(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue appearance-none bg-white/70 backdrop-blur-sm"
                    >
                      {aiActions.map(action => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Instruction Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modification Instruction
                  </label>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Describe the changes you want to make to the code..."
                    className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue resize-none bg-white/70 backdrop-blur-sm"
                    rows={3}
                  />
                </div>

                {/* Target Language */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Language (Optional)
                  </label>
                  <div className="relative">
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue appearance-none bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Keep original language</option>
                      {outputFormats.map(format => (
                        <option key={format} value={format}>
                          {format.charAt(0).toUpperCase() + format.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* File Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="my-component"
                    className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm"
                  />
                </div>

                {/* Process Button */}
                <button
                  onClick={processCode}
                  disabled={!selectedSpace || !selectedPage || isProcessing}
                  className="w-full bg-confluence-blue/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-confluence-blue disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Process Code</span>
                    </>
                  )}
                </button>

                {/* Impact Analyze Button - Only show when there are changes */}
                {hasChanges() && (
                  <button
                    onClick={analyzeImpact}
                    disabled={isImpactAnalyzing}
                    className="w-full bg-orange-600/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10 mt-3"
                  >
                    {isImpactAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing Impact...</span>
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-5 h-5" />
                        <span>Impact Analyze</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Middle Column - Original Code */}
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Original Code</h3>
                {detectedCode ? (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <pre className="text-sm text-gray-300">
                      <code>{detectedCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Select a code page to view content</p>
                  </div>
                )}
              </div>

              {summary && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Page Summary</h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-sm text-gray-700">{summary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Processed Code and Impact Results */}
            <div className="space-y-6">
              {/* AI Result section: show all outputs */}
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">AI Result</h3>
                </div>
                {aiActionOutput && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <div className="mb-2 text-sm text-gray-400">
                      <strong>AI Action:</strong> {aiAction}
                    </div>
                    <pre className="text-sm text-gray-300">
                      <code>{aiActionOutput}</code>
                    </pre>
                  </div>
                )}
                {conversionOutput && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <div className="mb-2 text-sm text-gray-400">
                      <strong>Target Language Conversion:</strong> {targetLanguage}
                    </div>
                    <pre className="text-sm text-gray-300">
                      <code>{conversionOutput}</code>
                    </pre>
                  </div>
                )}
                {modificationOutput && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <div className="mb-2 text-sm text-gray-400">
                      <strong>Modification Instruction:</strong> {instruction}
                    </div>
                    <pre className="text-sm text-gray-300">
                      <code>{modificationOutput}</code>
                    </pre>
                  </div>
                )}
                {/* Fallback: processedCode for legacy support */}
                {!aiActionOutput && !conversionOutput && !modificationOutput && processedCode && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <pre className="text-sm text-gray-300">
                      <code>{processedCode}</code>
                    </pre>
                  </div>
                )}
                {/* Fallback: empty state */}
                {!aiActionOutput && !conversionOutput && !modificationOutput && !processedCode && (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Process code to see AI results</p>
                  </div>
                )}
              </div>

              {/* Impact Analysis Results - Display below AI Result section */}
              {showImpactResults && impactResults && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <GitCompare className="w-5 h-5 mr-2" />
                    Impact Analysis Results
                  </h3>
                  
                  {/* Metrics Display */}
                  {impactMetrics && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Change Metrics</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-green-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                          <div className="font-semibold text-green-800">+{impactMetrics.linesAdded}</div>
                          <div className="text-green-600 text-xs">Added</div>
                        </div>
                        <div className="bg-red-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                          <div className="font-semibold text-red-800">-{impactMetrics.linesRemoved}</div>
                          <div className="text-red-600 text-xs">Removed</div>
                        </div>
                        <div className="bg-blue-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                          <div className="font-semibold text-blue-800">{impactMetrics.filesChanged}</div>
                          <div className="text-blue-600 text-xs">Files</div>
                        </div>
                        <div className="bg-purple-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                          <div className="font-semibold text-purple-800">{impactMetrics.percentageChanged}%</div>
                          <div className="text-purple-600 text-xs">Changed</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Level */}
                  {impactRiskLevel && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Risk Assessment</h4>
                      <div className={`p-3 rounded-lg flex items-center space-x-2 border ${getRiskColor(impactRiskLevel.level)}`}>
                        {getRiskIcon(impactRiskLevel.level)}
                        <div>
                          <div className="font-semibold capitalize">{impactRiskLevel.level} Risk</div>
                          <div className="text-sm">Score: {impactRiskLevel?.score}/10</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Code Diff */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Code Diff</h4>
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-80 border border-white/10">
                      <pre className="text-sm">
                        <code>
                          {impactResults.split('\n').map((line, index) => (
                            <div
                              key={index}
                              className={
                                line.startsWith('+') ? 'text-green-400' :
                                line.startsWith('-') ? 'text-red-400' :
                                line.startsWith('@@') ? 'text-blue-400' :
                                'text-gray-300'
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </code>
                      </pre>
                    </div>
                  </div>

                  {/* Impact Summary */}
                  {impactSummary && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">AI Impact Analysis</h4>
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 prose prose-sm max-w-none">
                        {impactSummary.split('\n').map((line, index) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
                          } else if (line.startsWith('## ')) {
                            return <h2 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(3)}</h2>;
                          } else if (line.startsWith('**')) {
                            const match = line.match(/\*\*(.*?)\*\*: (.*)/);
                            if (match) {
                              return <p key={index} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
                            }
                          } else if (line.startsWith('- **')) {
                            const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
                            if (match) {
                              return <p key={index} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
                            }
                          } else if (line.match(/^\d+\./)) {
                            return <p key={index} className="mb-2 font-medium">{line}</p>;
                          } else if (line.startsWith('- ')) {
                            return <p key={index} className="mb-2 text-gray-700 pl-4">• {line.substring(2)}</p>;
                          } else if (line.trim()) {
                            return <p key={index} className="mb-2 text-gray-700">{line}</p>;
                          }
                          return <br key={index} />;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {impactRecommendations && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Recommendations</h4>
                      <div className="bg-green-50/80 backdrop-blur-sm rounded-lg p-4 border border-green-200/50">
                        <div className="prose prose-sm max-w-none">
                          {impactRecommendations.split('\n').map((line, index) => {
                            if (line.startsWith('- ')) {
                              return <p key={index} className="mb-2 text-green-800">• {line.substring(2)}</p>;
                            } else if (line.trim()) {
                              return <p key={index} className="mb-2 text-green-800">{line}</p>;
                            }
                            return <br key={index} />;
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {impactRiskLevel && impactRiskLevel.factors && impactRiskLevel.factors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Risk Factors</h4>
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <ul className="space-y-2">
                          {impactRiskLevel.factors.map((factor, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span className="text-gray-700 text-sm">{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Export Options */}
              {processedCode && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Export Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Export Format:</label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="px-3 py-1 border border-white/30 rounded text-sm focus:ring-2 focus:ring-confluence-blue bg-white/70 backdrop-blur-sm"
                      >
                        <option value="markdown">Markdown</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">Word Document</option>
                        <option value="txt">Plain Text</option>
                      </select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => exportCode(exportFormat)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-green-700 transition-colors border border-white/10"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      <button
                        onClick={async () => {
                          const { space, page } = getConfluenceSpaceAndPageFromUrl();
                          if (!space || !page) {
                            alert('Confluence space or page not specified in macro src URL.');
                            return;
                          }
                          try {
                            await apiService.saveToConfluence({
                              space_key: space,
                              page_title: page,
                              content: processedCode || '',
                            });
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          } catch (err: any) {
                            alert('Failed to save to Confluence: ' + (err.message || err));
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-confluence-blue/90 backdrop-blur-sm text-white rounded-lg hover:bg-confluence-blue transition-colors border border-white/10"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save to Confluence</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div style={{position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: '#2684ff', color: 'white', padding: '16px 32px', borderRadius: 8, zIndex: 9999, fontWeight: 600, fontSize: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.15)'}}>
          Saved to Confluence! Please refresh this Confluence page to see your changes.
        </div>
      )}
    </div>
  );
};

export default CodeAssistant; 