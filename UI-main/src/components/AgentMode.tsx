import React, { useState, useEffect } from 'react';
import { Zap, X, Send, Download, RotateCcw, FileText, Brain, CheckCircle, Loader2, MessageSquare, Plus, ChevronDown } from 'lucide-react';
import type { AppMode } from '../App';
import { apiService, analyzeGoal, getPagesWithType, PageWithType } from '../services/api';
import { getConfluenceSpaceAndPageFromUrl } from '../utils/urlUtils';

interface AgentModeProps {
  onClose: () => void;
  onModeSelect: (mode: AppMode) => void;
  autoSpaceKey?: string | null;
  isSpaceAutoConnected?: boolean;
}

interface PlanStep {
  id: number;
  title: string;
  status: 'pending' | 'running' | 'completed';
  details?: string;
}

interface OutputTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  content: string;
}

// Add helper to determine intent and content type
const determineToolByIntentAndContent = async (goal: string, space: string, page: string) => {
  // Heuristic intent detection
  const lowerGoal = goal.toLowerCase();
  // Fallback to 'text' content type (no backend support for content type detection)
  let contentType = 'text';
  // Intent-based routing
  if (/impact|change|difference|diff/.test(lowerGoal)) return 'impact_analyzer';
  if (/test|qa|test case|unit test/.test(lowerGoal)) return 'test_support';
  if (/convert|debug|refactor|fix|bug|error/.test(lowerGoal)) return 'code_assistant';
  if (/video|summarize.*video|transcribe/.test(lowerGoal)) return 'video_summarizer';
  if (/image|chart|diagram|visual/.test(lowerGoal)) return 'image_insights';
  // Default
  return 'ai_powered_search';
};

// Helper for Code Assistant AI actions (copied from CodeAssistant.tsx)
const codeAiActionPromptMap = (code: string): { [key: string]: string } => ({
  "Summarize Code": `Summarize the following code in clear and concise language:\n\n${code}`,
  "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${code}`,
  "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${code}`,
  "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${code}`,
  "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${code}`,
  "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${code}`,
});

// Helper to split user input into actionable instructions
function splitInstructions(input: string): string[] {
  // Simple split on ' and ', ' then ', or newlines; can be improved with NLP
  return input
    .split(/\band\b|\bthen\b|\n|\r|\r\n|\.|;/i)
    .map(instr => instr.trim())
    .filter(instr => instr.length > 0);
}

// Helper to split a single instruction with multiple related actions (e.g., 'optimize and convert')
function splitRelatedActions(instruction: string): string[] {
  // Heuristic: split on ' and ', ' then ', or ';' if the actions are likely related
  // This can be improved with NLP if needed
  return instruction
    .split(/\band\b|\bthen\b|;/i)
    .map(instr => instr.trim())
    .filter(instr => instr.length > 0);
}

// Extend OutputTab type for results
interface OutputTabWithResults extends OutputTab {
  results?: Array<any>;
}

// Add helper to render Impact Analyzer output in the reference image style
interface MetricsType {
  linesAdded?: number;
  linesRemoved?: number;
  filesChanged?: number;
  percentageChanged?: number;
}
function ImpactMetricsAndRisk({ metrics, riskScore, riskLevel }: { metrics: MetricsType, riskScore: number, riskLevel: string }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100/80 backdrop-blur-sm border-green-200/50';
      case 'medium': return 'text-yellow-700 bg-yellow-100/80 backdrop-blur-sm border-yellow-200/50';
      case 'high': return 'text-red-700 bg-red-100/80 backdrop-blur-sm border-red-200/50';
      default: return 'text-gray-700 bg-gray-100/80 backdrop-blur-sm border-gray-200/50';
    }
  };
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <span className="mr-2">🟢</span>;
      case 'medium': return <span className="mr-2">🟡</span>;
      case 'high': return <span className="mr-2">⚠️</span>;
      default: return <span className="mr-2">❔</span>;
    }
  };
  return (
    <div>
      <div className="mt-2 space-y-3">
        <h4 className="font-semibold text-gray-800">Change Metrics</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-green-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
            <div className="font-semibold text-green-800">+{metrics?.linesAdded ?? 0}</div>
            <div className="text-green-600 text-xs">Added</div>
          </div>
          <div className="bg-red-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
            <div className="font-semibold text-red-800">-{metrics?.linesRemoved ?? 0}</div>
            <div className="text-red-600 text-xs">Removed</div>
          </div>
          <div className="bg-blue-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
            <div className="font-semibold text-blue-800">{metrics?.filesChanged ?? 1}</div>
            <div className="text-blue-600 text-xs">Files</div>
          </div>
          <div className="bg-purple-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
            <div className="font-semibold text-purple-800">{metrics?.percentageChanged ?? 0}%</div>
            <div className="text-purple-600 text-xs">Changed</div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-2">Risk Assessment</h4>
        <div className={`p-3 rounded-lg flex items-center space-x-2 border ${getRiskColor(riskLevel)}`}>
          {getRiskIcon(riskLevel)}
          <div>
            <div className="font-semibold capitalize">{riskLevel} Risk</div>
            <div className="text-sm">Score: {riskScore}/10</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add helper to render Test Support Tool output in the same style as Tool Mode
function TestStrategyOutput({ strategy }: { strategy: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 prose prose-sm max-w-none">
      {strategy.split('\n').map((line: string, index: number) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
        } else if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(3)}</h2>;
        } else if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-gray-800 mt-8 mb-4">{line.substring(2)}</h1>;
        } else if (line.startsWith('- **')) {
          const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
          if (match) {
            return <p key={index} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
          }
        } else if (line.startsWith('- ')) {
          return <p key={index} className="mb-1 ml-4">• {line.substring(2)}</p>;
        } else if (line.trim()) {
          return <p key={index} className="mb-2 text-gray-700">{line}</p>;
        }
        return <br key={index} />;
      })}
    </div>
  );
}

const AgentMode: React.FC<AgentModeProps> = ({ onClose, onModeSelect, autoSpaceKey, isSpaceAutoConnected }) => {
  const [goal, setGoal] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('answer');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [outputTabs, setOutputTabs] = useState<OutputTabWithResults[]>([]);

  // Add new state for space/page selection and API results
  const [spaces, setSpaces] = useState<{ name: string; key: string }[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [pageTypes, setPageTypes] = useState<PageWithType[]>([]);

  // Add progressPercent state for live progress bar
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeResult, setActiveResult] = useState<{ type: string, key: string } | null>(null);

  // Auto-detect and auto-select space and page if only one exists, or from URL if provided
  useEffect(() => {
    const loadSpacesAndPages = async () => {
      try {
        const result = await apiService.getSpaces();
        setSpaces(result.spaces);
        // Auto-select space from URL if provided
        if (autoSpaceKey && isSpaceAutoConnected) {
          setSelectedSpace(autoSpaceKey);
          const pagesResult = await apiService.getPages(autoSpaceKey);
          setPages(pagesResult.pages);
          // Auto-select page from URL if present
          const { page } = getConfluenceSpaceAndPageFromUrl();
          if (page && pagesResult.pages.includes(page)) {
            setSelectedPages([page]);
          }
        } else if (result.spaces.length === 1) {
          const onlySpace = result.spaces[0];
          setSelectedSpace(onlySpace.key);
          const pagesResult = await apiService.getPages(onlySpace.key);
          setPages(pagesResult.pages);
          if (pagesResult.pages.length === 1) {
            setSelectedPages([pagesResult.pages[0]]);
          }
        }
      } catch (err) {
        setError('Failed to auto-detect Confluence space and page.');
      }
    };
    loadSpacesAndPages();
  }, [autoSpaceKey, isSpaceAutoConnected]);

  // Load pages when space is selected, and auto-select page if only one exists or from URL
  useEffect(() => {
    if (selectedSpace) {
      const loadPages = async () => {
        try {
          const result = await apiService.getPages(selectedSpace);
          setPages(result.pages);
          // Auto-select page from URL if present
          const { page } = getConfluenceSpaceAndPageFromUrl();
          if (page && result.pages.includes(page)) {
            setSelectedPages([page]);
          } else if (result.pages.length === 1) {
            setSelectedPages([result.pages[0]]);
          }
        } catch (err) {
          setError('Failed to load pages.');
        }
      };
      loadPages();
    }
  }, [selectedSpace]);

  // Fetch page types when space or pages change
  useEffect(() => {
    const fetchPageTypes = async () => {
      if (selectedSpace) {
        try {
          const result = await getPagesWithType(selectedSpace);
          setPageTypes(result.pages);
        } catch (err) {
          // fallback: just set empty
          setPageTypes([]);
        }
      }
    };
    fetchPageTypes();
  }, [selectedSpace, pages.length]);

  // Sync "Select All" checkbox state
  useEffect(() => {
    setSelectAllPages(pages.length > 0 && selectedPages.length === pages.length);
  }, [selectedPages, pages]);

  const toggleSelectAllPages = () => {
    if (selectAllPages) {
      setSelectedPages([]);
    } else {
      setSelectedPages([...pages]);
    }
    setSelectAllPages(!selectAllPages);
  };

  const handleGoalSubmit = async () => {
    if (!goal.trim() || !selectedSpace || !selectedPages.length) {
      setError('Please enter a goal, select a space, and at least one page.');
      return;
    }
    setIsPlanning(true);
    setError('');
    setPlanSteps([
      { id: 1, title: 'Analyzing Goal', status: 'pending' },
      { id: 2, title: 'Executing', status: 'pending' },
    ]);
    setOutputTabs([]);
    setCurrentStep(0);
    setActiveTab('final-answer');
    setProgressPercent(0);
    let reasoningLines: string[] = [];
    try {
      setPlanSteps((steps) => steps.map((s) => s.id === 1 ? { ...s, status: 'running' } : s));
      setCurrentStep(0);
      // Split instructions
      const instructions = splitInstructions(goal);
      // Map each instruction to the correct page/tool based on content type and intent
      const impactResults: Array<{ page: string, result: string, riskRating?: number, riskDiff?: number, metrics?: MetricsType, riskLevel?: string }> = [];
      const testStrategyResults: Array<{ strategy: string }> = [];
      const pageResults: Record<string, { tool: string, outputs: string[] }> = {};
      let optimizedCodeByPage: Record<string, string> = {};
      let toolsTriggered: string[] = [];
      let whyUsed: string[] = [];
      let howDerived: string[] = [];
      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        const pageTypeMap: Record<string, string> = {};
        for (const p of pageTypes) {
          pageTypeMap[p.title] = p.content_type;
        }
        let matchedPages: string[] = [];
        let toolForInstruction = '';
        for (const page of selectedPages) {
          const type = pageTypeMap[page] || 'text';
          const tool = await determineToolByIntentAndContent(instruction, selectedSpace, page);
          if (
            (tool === 'code_assistant' && type === 'code') ||
            (tool === 'video_summarizer' && type === 'video') ||
            (tool === 'image_insights' && type === 'image') ||
            (tool === 'ai_powered_search' && type === 'text') ||
            (tool === 'impact_analyzer' && type === 'code') ||
            (tool === 'test_support' && type === 'code')
          ) {
            matchedPages.push(page);
            toolForInstruction = tool;
          }
        }
        if (!matchedPages.length && selectedPages.length > 0) {
          matchedPages = [selectedPages[0]];
          toolForInstruction = await determineToolByIntentAndContent(instruction, selectedSpace, selectedPages[0]);
        }
        // Only trigger Test Strategy if explicitly requested
        if (toolForInstruction === 'test_support' && matchedPages.length === 2 && /test\s*strategy|generate\s*test/i.test(instruction)) {
          const [codePage, testInputPage] = matchedPages;
          const res = await apiService.testSupport({ space_key: selectedSpace, code_page_title: codePage, test_input_page_title: testInputPage, question: instruction });
          testStrategyResults.push({ strategy: res.test_strategy || res.ai_response || '' });
          toolsTriggered.push('Test Support Tool');
          whyUsed.push('Test Support Tool was used because the instruction requested a test strategy for the uploaded pages.');
          howDerived.push(`The test strategy was generated by analyzing the code and test input pages using the Test Support Tool.`);
        }
        // Only trigger Impact Analyzer if explicitly requested and two pages are present
        else if (toolForInstruction === 'impact_analyzer' && matchedPages.length === 2 && /impact|compare|difference|diff/i.test(instruction)) {
          const [oldPage, newPage] = matchedPages;
          const res = await apiService.impactAnalyzer({ space_key: selectedSpace, old_page_title: oldPage, new_page_title: newPage, question: instruction });
          let riskRating = res.risk_score || 0;
          let riskDiff = res.percentage_change || 0;
          impactResults.push({ page: `${oldPage} vs ${newPage}`, result: res.impact_analysis, riskRating, riskDiff, metrics: {
            linesAdded: res.lines_added,
            linesRemoved: res.lines_removed,
            filesChanged: res.files_changed,
            percentageChanged: res.percentage_change,
          }, riskLevel: res.risk_level });
          toolsTriggered.push('Impact Analyzer');
          whyUsed.push('Impact Analyzer was used because the instruction requested a code impact analysis between two uploaded pages.');
          howDerived.push(`The impact analysis was performed by comparing the code content of the two pages using the Impact Analyzer.`);
        }
        // Special handling for sequential code actions and impact analysis
        else if (matchedPages.length === 1 && toolForInstruction === 'code_assistant') {
          const relatedActions = splitRelatedActions(instruction);
          let lastOutput = '';
          let aiActionOutput = '';
          let conversionOutput = '';
          let modificationOutput = '';
          
          for (const action of relatedActions) {
            const result = await apiService.codeAssistant({
              space_key: selectedSpace,
              page_title: matchedPages[0],
              instruction: action
            });
            
            // Determine output type based on action content
            if (/optimize|refactor|dead code|docs|logging/i.test(action)) {
              // AI Action
              aiActionOutput = result.modified_code || result.converted_code || result.original_code || 'AI action completed successfully.';
              toolsTriggered.push('Code Assistant (AI Action)');
              whyUsed.push('Code Assistant AI Action was used to perform code optimization/refactoring as requested.');
              howDerived.push(`The AI action was applied to the code page to ${action.toLowerCase()}.`);
            } else if (/convert|language|to\s+\w+/i.test(action)) {
              // Language Conversion
              conversionOutput = result.converted_code || result.modified_code || result.original_code || 'Language conversion completed successfully.';
              toolsTriggered.push('Code Assistant (Language Conversion)');
              whyUsed.push('Code Assistant Language Conversion was used to convert code to the target language.');
              howDerived.push(`The code was converted to the specified target language as requested.`);
            } else {
              // Modification
              modificationOutput = result.modified_code || result.converted_code || result.original_code || 'Modification completed successfully.';
              toolsTriggered.push('Code Assistant (Modification)');
              whyUsed.push('Code Assistant Modification was used to apply the requested changes to the code.');
              howDerived.push(`The modification instruction was applied to the code page.`);
            }
            
            lastOutput = result.modified_code || result.converted_code || result.original_code || '';
          }
          
          // Store results in the same format as Tool Mode Code Assistant
          const outputs: string[] = [];
          if (aiActionOutput) outputs.push(`AI Action Output:\n${aiActionOutput}`);
          if (conversionOutput) outputs.push(`Target Language Conversion Output:\n${conversionOutput}`);
          if (modificationOutput) outputs.push(`Modification Output:\n${modificationOutput}`);
          if (!aiActionOutput && !conversionOutput && !modificationOutput && lastOutput) {
            outputs.push(`Processed Code:\n${lastOutput}`);
          }
          
          pageResults[matchedPages[0]] = {
            tool: 'code_assistant',
            outputs
          };
        } else if (toolForInstruction === 'impact_analyzer' && matchedPages.length === 2) {
          // If previous instruction was a code modification for page_1, use optimized code for impact analysis
          const [page1, page2] = matchedPages;
          let oldCode = optimizedCodeByPage[page1] || '';
          let newCode = '';
          // If the user just optimized page_1, use that output
          // (In a real implementation, you might need to update the backend to accept raw code for impact analysis)
          // For now, just call the API as usual
          const res = await apiService.impactAnalyzer({ space_key: selectedSpace, old_page_title: page1, new_page_title: page2, question: instruction });
          // Extract risk rating and risk difference from the response if available
          let riskRating = res.risk_score || 0;
          let riskDiff = res.percentage_change || 0;
          impactResults.push({ page: `${page1} vs ${page2}`, result: res.impact_analysis, riskRating, riskDiff });
        } else if (toolForInstruction === 'impact_analyzer' && matchedPages.length === 1) {
          for (const page of matchedPages) {
            const res = await apiService.impactAnalyzer({ space_key: selectedSpace, old_page_title: page, new_page_title: page, question: instruction });
            let riskRating = res.risk_score || 0;
            let riskDiff = res.percentage_change || 0;
            impactResults.push({ page, result: res.impact_analysis, riskRating, riskDiff });
          }
        } else {
          for (const page of matchedPages) {
            let output = '';
            let toolLabel = '';
            if (toolForInstruction === 'ai_powered_search') {
              const res = await apiService.search({ space_key: selectedSpace, page_titles: [page], query: instruction });
              output = res.response;
              toolLabel = 'AI Powered Search';
            } else if (toolForInstruction === 'video_summarizer') {
              const res = await apiService.videoSummarizer({ space_key: selectedSpace, page_title: page });
              if (res.timestamps && Array.isArray(res.timestamps) && res.timestamps.length > 0) {
                output = res.timestamps.map((ts: string, idx: number) => {
                  let point = Array.isArray(res.summary) ? res.summary[idx] : (typeof res.summary === 'string' ? res.summary.split(/\n|\r|\r\n/)[idx] : '');
                  return ts ? `[${ts}] ${point}` : point;
                }).filter(Boolean).join('\n');
              } else {
                output = 'No timestamped summary available.';
              }
              toolLabel = 'Video Summarizer';
            } else if (toolForInstruction === 'test_support') {
              const res = await apiService.testSupport({ space_key: selectedSpace, code_page_title: page });
              output = res.test_strategy || res.ai_response || '';
              toolLabel = 'Test Support';
            } else if (toolForInstruction === 'image_insights') {
              const images = await apiService.getImages(selectedSpace, page);
        if (images && images.images && images.images.length > 0) {
                const summaries = await Promise.all(images.images.map((imgUrl: string) => apiService.imageSummary({ space_key: selectedSpace, page_title: page, image_url: imgUrl })));
                output = summaries.map((s, i) => `Image ${i + 1}: ${s.summary}`).join('\n');
              }
              toolLabel = 'Image Insights';
            } else if (toolForInstruction === 'chart_builder') {
              const images = await apiService.getImages(selectedSpace, page);
              if (images && images.images && images.images.length > 0) {
                const charts = await Promise.all(images.images.map((imgUrl: string) => apiService.createChart({ space_key: selectedSpace, page_title: page, image_url: imgUrl, chart_type: 'bar', filename: 'chart', format: 'png' })));
                output = charts.map((c, i) => `Chart ${i + 1}: [Chart Image]`).join('\n');
              }
              toolLabel = 'Chart Builder';
            }
            if (!pageResults[page]) pageResults[page] = { tool: toolLabel, outputs: [] };
            pageResults[page].outputs.push(output);
          }
        }
      }
      setPlanSteps((steps) => steps.map((s) => s.id === 1 ? { ...s, status: 'completed' } : s));
      setCurrentStep(1);
      setProgressPercent(50);
      setPlanSteps((steps) => steps.map((s) => s.id === 2 ? { ...s, status: 'running' } : s));
      setPlanSteps((steps) => steps.map((s) => s.id === 2 ? { ...s, status: 'completed' } : s));
      setCurrentStep(2);
      setProgressPercent(100);
      // Reasoning section: always fill with 3 lines
      const reasoning = [
        `Tools triggered: ${toolsTriggered.join(', ') || 'None'}.`,
        whyUsed[0] || 'The tools were chosen based on the user instruction and content type of the uploaded pages.',
        howDerived[0] || 'The answer was derived by applying the selected tools to the uploaded pages as per the instruction.'
      ].join('\n');
      // Prepare output tabs for new UI
      const impactTab = impactResults.length > 0 ? {
        id: 'impact-analysed',
        label: 'Impact Analysed',
        icon: FileText,
        content: '',
        results: impactResults,
      } : null;
      const testStrategyTab = testStrategyResults.length > 0 ? {
        id: 'test-strategy',
        label: 'Test Strategy',
        icon: FileText,
        content: '',
        results: testStrategyResults,
      } : null;
      const pageTabs = Object.keys(pageResults).length > 0 ? [
        {
          id: 'per-page-results',
          label: 'Page Results',
          icon: FileText,
          content: '',
          results: Object.entries(pageResults).map(([page, { tool, outputs }]) => ({ page, tool, result: outputs.join('\n\n') })),
        }
      ] : [];
      const tabs = [
        ...(impactTab ? [impactTab] : []),
        ...(testStrategyTab ? [testStrategyTab] : []),
        ...pageTabs,
        {
          id: 'reasoning',
          label: 'Reasoning',
          icon: Brain,
          content: reasoning,
        },
        {
          id: 'selected-pages',
          label: 'Selected Pages',
          icon: FileText,
          content: selectedPages.join(', '),
        },
      ];
      setOutputTabs(tabs);
      setActiveTab(impactTab ? 'impact-analysed' : testStrategyTab ? 'test-strategy' : (pageTabs.length > 0 ? 'per-page-results' : 'reasoning'));
      setActiveResult(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred during orchestration.');
    } finally {
      setIsPlanning(false);
      setCurrentStep(2);
      setProgressPercent(100);
    }
  };

  const executeSteps = async (steps: PlanStep[]) => {
    setIsExecuting(true);
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Update step to running
      setPlanSteps(prev => prev.map(step => 
        step.id === i + 1 
          ? { ...step, status: 'running', details: getStepDetails(i) }
          : step
      ));
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update step to completed
      setPlanSteps(prev => prev.map(step => 
        step.id === i + 1 
          ? { ...step, status: 'completed', details: getCompletedDetails(i) }
          : step
      ));
    }
    
    // Generate output tabs
    const tabs: OutputTab[] = [
      {
        id: 'answer',
        label: 'Final Answer',
        icon: FileText,
        content: generateFinalAnswer()
      },
      {
        id: 'reasoning',
        label: 'Reasoning Steps',
        icon: Brain,
        content: generateReasoningSteps()
      },
      {
        id: 'tools',
        label: 'Used Tools',
        icon: Zap,
        content: generateUsedTools()
      },
      {
        id: 'qa',
        label: 'Follow-Up Q&A',
        icon: MessageSquare,
        content: 'Ask follow-up questions to refine or expand on this analysis.'
      }
    ];
    
    setOutputTabs(tabs);
    setIsExecuting(false);
    setShowFollowUp(true);
  };

  const getStepDetails = (stepIndex: number) => {
    const details = [
      '🔍 Searching Confluence...',
      '📊 Analyzing content...',
      '💡 Generating recommendations...'
    ];
    return details[stepIndex];
  };

  const getCompletedDetails = (stepIndex: number) => {
    const details = [
      '✅ Found 3 relevant pages',
      '✅ Content summarized',
      '✅ Recommendations generated'
    ];
    return details[stepIndex];
  };

  const generateFinalAnswer = () => {
    return `Based on your goal: "${goal}"

## Analysis Summary
I've analyzed the relevant Confluence content and identified key areas for improvement. The system has processed multiple pages and extracted actionable insights.

## Key Recommendations
1. **Immediate Actions**: Update documentation structure for better navigation
2. **Process Improvements**: Implement automated content review workflows  
3. **Long-term Strategy**: Establish content governance guidelines

## Next Steps
- Review the detailed reasoning in the "Reasoning Steps" tab
- Check which tools were used in the "Used Tools" tab
- Ask follow-up questions for clarification or refinement

*Analysis completed at ${new Date().toLocaleString()}*`;
  };

  const generateReasoningSteps = () => {
    return `## Step-by-Step Reasoning

### 1. Context Retrieval
- Searched across Engineering, Product, and Documentation spaces
- Identified 3 relevant pages containing goal-related information
- Extracted key themes and patterns from content

### 2. Content Analysis
- Summarized main points from each source
- Identified gaps and inconsistencies
- Analyzed current state vs desired outcomes

### 3. Recommendation Generation
- Applied best practices from similar scenarios
- Considered organizational constraints and capabilities
- Prioritized recommendations by impact and feasibility

### Decision Factors
- **Relevance**: How closely content matched the stated goal
- **Completeness**: Coverage of all aspects mentioned in the goal
- **Actionability**: Practical steps that can be implemented`;
  };

  const generateUsedTools = () => {
    return `## Tools Utilized in This Analysis

### 🔍 AI Powered Search
- **Purpose**: Retrieved relevant content from Confluence spaces
- **Scope**: Searched across 3 spaces, analyzed 5 pages
- **Results**: Found key documentation and process information

### 📊 Content Analyzer
- **Purpose**: Processed and summarized retrieved content
- **Method**: Natural language processing and pattern recognition
- **Output**: Structured insights and key themes

### 💡 Recommendation Engine
- **Purpose**: Generated actionable recommendations
- **Approach**: Best practice matching and gap analysis
- **Deliverable**: Prioritized action items with implementation guidance

### Integration Points
All tools worked together seamlessly to provide a comprehensive analysis of your goal.`;
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !selectedSpace || selectedPages.length === 0) return;
    try {
      const searchResult = await apiService.search({
        space_key: selectedSpace,
        page_titles: selectedPages,
        query: followUpQuestion,
      });
      const qaContent = outputTabs.find(tab => tab.id === 'qa')?.content || '';
      const updatedQA = `${qaContent}\n\n**Q: ${followUpQuestion}**\n\nA: ${searchResult.response}`;
      setOutputTabs(prev => prev.map(tab =>
        tab.id === 'qa' ? { ...tab, content: updatedQA } : tab
      ));
      setFollowUpQuestion('');
    } catch (err) {
      setError('Failed to get follow-up answer.');
    }
  };

  const exportPlan = () => {
    const content = `# AI Agent Analysis Report

## Goal
${goal}

## Execution Plan
${planSteps.map(step => `${step.id}. ${step.title} - ${step.status}`).join('\n')}

## Final Answer
${outputTabs.find(tab => tab.id === 'answer')?.content || ''}

## Reasoning Steps
${outputTabs.find(tab => tab.id === 'reasoning')?.content || ''}

## Tools Used
${outputTabs.find(tab => tab.id === 'used-tools')?.content || ''}

---
*Generated by Confluence AI Assistant - Agent Mode*
*Date: ${new Date().toLocaleString()}*`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-agent-analysis.md';
    a.click();
  };

  const replaySteps = () => {
    setPlanSteps([]);
    setCurrentStep(0);
    setOutputTabs([]);
    setShowFollowUp(false);
    setActiveTab('answer');
    handleGoalSubmit();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white/80 backdrop-blur-xl border-2 border-[#DFE1E6] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/90 to-orange-600/90 backdrop-blur-xl p-6 text-white border-b border-orange-300/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Agent Mode</h2>
                <p className="text-orange-100/90">Goal-based AI assistance with planning and execution</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onModeSelect('tool')}
                className="text-orange-100 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1 text-sm transition-colors"
              >
                Switch to Tool Mode
              </button>
              <button onClick={onClose} className="text-white hover:bg-white/10 rounded-full p-2 backdrop-blur-sm">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Manual Space/Page Selection UI */}
          {!planSteps.length && !isPlanning && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Detected Confluence Context</h3>
                {selectedSpace && selectedPages.length === 1 && (
                  <div className="mb-4 text-green-700 font-semibold">
                    Auto-selected: Space <span className="font-bold">{spaces.find(s => s.key === selectedSpace)?.name || selectedSpace}</span> &nbsp;|&nbsp; Page <span className="font-bold">{selectedPages[0]}</span>
                  </div>
                )}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              {/* Manual Space/Page Selection UI */}
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg mt-6 text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manual Space & Page Selection</h3>
                {/* Space Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Confluence Space
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Choose a space...</option>
                      {spaces.map(space => (
                        <option key={space.key} value={space.key}>{space.name} ({space.key})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {/* Page Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pages to Analyze
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-white/30 rounded-lg p-2 bg-white/50 backdrop-blur-sm">
                    {pages.map(page => (
                      <label key={page} className="flex items-center space-x-2 p-2 hover:bg-white/30 rounded cursor-pointer backdrop-blur-sm">
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPages([...selectedPages, page]);
                            } else {
                              setSelectedPages(selectedPages.filter(p => p !== page));
                            }
                          }}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{page}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mb-2 mt-2">
                    <input
                      type="checkbox"
                      checked={selectAllPages}
                      onChange={toggleSelectAllPages}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">Select All Pages</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPages.length} page(s) selected
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Goal Input Section */}
          {!planSteps.length && !isPlanning && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-lg text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">What do you want the assistant to help you achieve?</h3>
                <div className="relative">
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Describe your goal in detail... (e.g., 'Help me analyze our documentation structure and recommend improvements for better user experience')"
                    className="w-full p-4 border-2 border-orange-200/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white/70 backdrop-blur-sm text-lg"
                    rows={4}
                  />
                  <button
                    onClick={handleGoalSubmit}
                    disabled={!goal.trim() || !selectedSpace || selectedPages.length === 0}
                    className="absolute bottom-4 right-4 bg-orange-500/90 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors border border-white/10"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              </div>
            </div>
          )}

          {/* Execution Phase */}
          {planSteps.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Progress Timeline */}
              <div className="lg:col-span-1">
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Live Progress Log</h3>
                  <div className="space-y-4">
                    {planSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : step.status === 'running' ? (
                            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{step.title}</div>
                          {step.details && (
                            <div className="text-sm text-gray-600 mt-1">{step.details}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                      {/* Stage markers */}
                      <div className="absolute left-0 top-0 h-3 w-1 bg-orange-700 rounded-full" title="Start" />
                      <div className="absolute left-1/2 top-0 h-3 w-1 bg-orange-700 rounded-full" style={{ left: '50%' }} title="Analyzed" />
                      <div className="absolute right-0 top-0 h-3 w-1 bg-orange-700 rounded-full" title="Complete" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Start</span>
                      <span>Analyzed</span>
                      <span>Complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Columns - Output Tabs */}
              <div className="lg:col-span-2">
                {outputTabs.length > 0 && (
                  <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg overflow-hidden">
                    {/* Tab Headers */}
                    <div className="border-b border-white/20 bg-white/40 backdrop-blur-sm">
                      <div className="flex overflow-x-auto">
                        {outputTabs.map(tab => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                  ? 'border-orange-500 text-orange-600 bg-white/50'
                                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-white/30'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                      {outputTabs.find(tab => tab.id === activeTab) && (
                        <div className="prose prose-sm max-w-none">
                          {activeTab === 'impact-analysed' ? (
                            <div>
                              <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={() => setActiveResult(activeResult && activeResult.type === 'impact' ? null : { type: 'impact', key: outputTabs.find(t => t.id === 'impact-analysed')?.results?.[0]?.page || '' })}>
                                Impact Analysed
                              </button>
                              {activeResult && activeResult.type === 'impact' && (
                                <div className="mt-4">
                                  {/* Use ImpactMetricsAndRisk for the first (or only) result */}
                                  {(() => {
                                    const r = outputTabs.find(t => t.id === 'impact-analysed')?.results?.[0];
                                    if (!r) return null;
                                    return <ImpactMetricsAndRisk metrics={r.metrics} riskScore={r.riskRating} riskLevel={r.riskLevel} />;
                                  })()}
                                  <div className="whitespace-pre-wrap text-gray-700 border rounded p-4 bg-white/80 mt-4">
                                    {outputTabs.find(t => t.id === 'impact-analysed')?.results?.[0]?.result}
                              </div>
                                </div>
                              )}
                            </div>
                          ) : activeTab === 'test-strategy' ? (
                            <div>
                              <button className="px-4 py-2 bg-confluence-blue text-white rounded" onClick={() => setActiveResult(activeResult && activeResult.type === 'test-strategy' ? null : { type: 'test-strategy', key: 'test-strategy' })}>
                                Test Strategy
                                    </button>
                              {activeResult && activeResult.type === 'test-strategy' && (
                                <div className="mt-4">
                                  {/* Use TestStrategyOutput for the first (or only) result */}
                                  {(() => {
                                    const r = outputTabs.find(t => t.id === 'test-strategy')?.results?.[0];
                                    if (!r) return null;
                                    return <TestStrategyOutput strategy={r.strategy} />;
                                  })()}
                                  </div>
                              )}
                            </div>
                          ) : activeTab === 'per-page-results' ? (
                            <div>
                              {(outputTabs.find(t => t.id === 'per-page-results')?.results || []).map((r: { page: string }) => (
                                <button key={r.page} className={`px-4 py-2 m-1 rounded ${activeResult && activeResult.key === r.page ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setActiveResult({ type: 'page', key: r.page })}>
                                  {r.page}
                                </button>
                              ))}
                              {activeResult && activeResult.type === 'page' && (
                                <div className="mt-4 whitespace-pre-wrap text-gray-700 border rounded p-4 bg-white/80">
                                  {(outputTabs.find(t => t.id === 'per-page-results')?.results || []).find((r: { page: string }) => r.page === activeResult.key)?.result}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap text-gray-700">
                              {outputTabs.find(tab => tab.id === activeTab)?.content.split('\n').map((line, index) => {
                                if (line.startsWith('### ')) {
                                  return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
                                } else if (line.startsWith('## ')) {
                                  return <h2 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(3)}</h2>;
                                } else if (line.startsWith('# ')) {
                                  return <h1 key={index} className="text-2xl font-bold text-gray-800 mt-8 mb-4">{line.substring(2)}</h1>;
                                } else if (line.startsWith('- **')) {
                                  const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
                                  if (match) {
                                    return <p key={index} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
                                  }
                                } else if (line.startsWith('- ')) {
                                  return <p key={index} className="mb-1 ml-4"> 2 {line.substring(2)}</p>;
                                } else if (line.trim()) {
                                  return <p key={index} className="mb-2 text-gray-700">{line}</p>;
                                }
                                return <br key={index} />;
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {planSteps.length > 0 && !isPlanning && !isExecuting && (
            <div className="flex justify-end mt-8 space-x-4">
              <button
                onClick={exportPlan}
                className="px-6 py-3 bg-orange-500/90 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold shadow-md border border-white/10"
              >
                <Download className="w-5 h-5 inline-block mr-2" />
                Export Plan
              </button>
              <button
                onClick={replaySteps}
                className="px-6 py-3 bg-white/80 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-semibold shadow-md border border-orange-200/50"
              >
                <RotateCcw className="w-5 h-5 inline-block mr-2" />
                Replay Steps
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentMode; 