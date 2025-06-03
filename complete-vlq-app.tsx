import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Download, Share2, Save, FileText, Printer, RefreshCw, HelpCircle, AlertTriangle, CheckCircle, Target, TrendingUp, Lightbulb, Clock, ChevronDown, ChevronUp, RotateCcw, Upload } from 'lucide-react';

const VLQApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [vlq1Data, setVlq1Data] = useState({});
  const [vlq2Data, setVlq2Data] = useState({});
  const [vlq1Phase, setVlq1Phase] = useState('importance');
  const [vlq2CurrentArea, setVlq2CurrentArea] = useState(0);
  const [vlq2Priorities, setVlq2Priorities] = useState({ five: [], three: [], one: null });
  
  // New state for enhanced features
  const [showTooltip, setShowTooltip] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const chartRef = useRef(null);

  const lifeAreas = [
    'Family (other than marriage or parenting)',
    'Marriage/couples/intimate relations',
    'Parenting',
    'Friends/social life',
    'Work',
    'Education/training',
    'Recreation/fun',
    'Spirituality',
    'Citizenship/community life',
    'Physical self-care (diet, exercise, sleep)'
  ];

  const vlq2Areas = [
    ...lifeAreas,
    'The Environment (caring for the planet)',
    'Aesthetics (art, music, literature, beauty)'
  ];

  const vlq2Dimensions = [
    { key: 'possibility', label: 'Possibility', desc: 'How possible is it that something meaningful could happen in this area?' },
    { key: 'currentImportance', label: 'Current Importance', desc: 'How important is this area at this time in your life?' },
    { key: 'overallImportance', label: 'Overall Importance', desc: 'How important is this area in your life as a whole?' },
    { key: 'action', label: 'Action', desc: 'How much have you acted in service of this area during the past week?' },
    { key: 'satisfaction', label: 'Satisfied with Action', desc: 'How satisfied are you with your level of action in this area?' },
    { key: 'concern', label: 'Concern', desc: 'How concerned are you that this area will not progress as you want?' }
  ];

  // Initialize data and check for mobile
  useEffect(() => {
    const initVlq1 = {};
    const initVlq2 = {};
    
    lifeAreas.forEach((area, index) => {
      initVlq1[index] = { importance: 5, consistency: 5 };
    });
    
    vlq2Areas.forEach((area, index) => {
      initVlq2[index] = {
        possibility: 5,
        currentImportance: 5,
        overallImportance: 5,
        action: 5,
        satisfaction: 5,
        concern: 5
      };
    });
    
    setVlq1Data(initVlq1);
    setVlq2Data(initVlq2);

    // Check for mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check for saved data
    const saved = localStorage.getItem('vlq-progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSavedData(data);
        setShowRecovery(true);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-save progress
  useEffect(() => {
    const saveProgress = () => {
      const progressData = {
        vlq1Data,
        vlq2Data,
        vlq2Priorities,
        currentView,
        vlq1Phase,
        vlq2CurrentArea,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('vlq-progress', JSON.stringify(progressData));
    };

    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [vlq1Data, vlq2Data, vlq2Priorities, currentView, vlq1Phase, vlq2CurrentArea]);

  // Recovery functions
  const recoverData = () => {
    if (savedData) {
      setVlq1Data(savedData.vlq1Data || {});
      setVlq2Data(savedData.vlq2Data || {});
      setVlq2Priorities(savedData.vlq2Priorities || { five: [], three: [], one: null });
      setCurrentView(savedData.currentView || 'home');
      setVlq1Phase(savedData.vlq1Phase || 'importance');
      setVlq2CurrentArea(savedData.vlq2CurrentArea || 0);
    }
    setShowRecovery(false);
  };

  const dismissRecovery = () => {
    setShowRecovery(false);
  };

  // Export functions
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pdfContent = generatePDFContent();
      const dataStr = `data:application/pdf;base64,${btoa(pdfContent)}`;
      const link = document.createElement('a');
      link.href = dataStr;
      link.download = `VLQ-Results-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    const exportData = {
      vlq1Data,
      vlq2Data,
      vlq2Priorities,
      gapAnalysis: calculateGapInsights(),
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VLQ-Data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const gapData = calculateGapInsights();
    let csvContent = "Area,Importance,Consistency,Gap,Priority,Insight\n";
    
    gapData.forEach(item => {
      const insight = item.insight.replace(/"/g, '""');
      csvContent += `"${item.area}",${item.importance},${item.consistency},${item.gap},"${item.priority}","${insight}"\n`;
    });
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VLQ-Results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareResults = async () => {
    const summary = generateTextSummary();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My VLQ Results',
          text: summary,
          url: window.location.href
        });
      } catch (error) {
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    const summary = generateTextSummary();
    try {
      await navigator.clipboard.writeText(summary);
      alert('Results copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateTextSummary = () => {
    const gapData = calculateGapInsights();
    const significantGaps = gapData.filter(item => item.gap >= 3);
    
    return `VLQ Results Summary
Generated: ${new Date().toLocaleDateString()}

Top Priority Areas:
${significantGaps.slice(0, 3).map(item => `• ${item.area} (Gap: ${item.gap})`).join('\n')}

Key Insights:
- ${significantGaps.length} areas need attention
- ${gapData.filter(item => Math.abs(item.gap) <= 1).length} areas well-aligned
- Focus on highest importance + largest gap areas first

View full results at: ${window.location.href}`;
  };

  const generatePDFContent = () => {
    return "VLQ Results Report - Generated PDF Content";
  };

  // Gap analysis functions
  const calculateGapInsights = () => {
    return lifeAreas.map((area, index) => {
      const data = vlq1Data[index] || { importance: 5, consistency: 5 };
      const gap = data.importance - data.consistency;
      
      return {
        area,
        importance: data.importance,
        consistency: data.consistency,
        gap,
        priority: data.importance >= 8 && gap >= 2 ? 'high' : 
                 gap >= 3 ? 'medium' : 
                 Math.abs(gap) <= 1 ? 'aligned' : 'review',
        insight: generateNarrativeInsight(area, data.importance, data.consistency, gap)
      };
    }).sort((a, b) => b.gap - a.gap);
  };

  const generateNarrativeInsight = (area, importance, consistency, gap) => {
    if (gap >= 4) {
      return `Critical misalignment in ${area}. High importance (${importance}/10) but low consistency (${consistency}/10) suggests significant barriers or competing priorities.`;
    } else if (gap === 3) {
      return `Significant gap in ${area}. You value this highly but actions don't reflect this importance.`;
    } else if (gap === 2) {
      return `Moderate gap in ${area}. Room for better alignment between values and actions.`;
    } else if (Math.abs(gap) <= 1) {
      return `Well aligned in ${area}. Actions match your values effectively.`;
    } else {
      return `Over-investment in ${area}. Consider if this energy could be redirected to higher-priority values.`;
    }
  };

  const getGapAnalysis = () => {
    const insights = calculateGapInsights();
    return {
      significantGaps: insights.filter(item => item.gap >= 3),
      moderateGaps: insights.filter(item => item.gap === 2),
      wellAligned: insights.filter(item => Math.abs(item.gap) <= 1),
      overInvested: insights.filter(item => item.gap < -1)
    };
  };

  const getOverallProgress = () => {
    let completed = 0;
    let total = 0;
    
    if (vlq1Phase === 'consistency' || currentView === 'vlq1-results') {
      completed += lifeAreas.length * 2;
    } else if (vlq1Phase === 'importance') {
      completed += Object.keys(vlq1Data).filter(key => vlq1Data[key].importance !== 5).length;
    }
    total += lifeAreas.length * 2;
    
    completed += vlq2CurrentArea * vlq2Dimensions.length;
    total += vlq2Areas.length * vlq2Dimensions.length;
    
    return Math.round((completed / total) * 100);
  };

  // Update functions
  const updateVlq1 = (areaIndex, field, value) => {
    setVlq1Data(prev => ({
      ...prev,
      [areaIndex]: { ...prev[areaIndex], [field]: value }
    }));
  };

  const updateVlq2 = (areaIndex, field, value) => {
    setVlq2Data(prev => ({
      ...prev,
      [areaIndex]: { ...prev[areaIndex], [field]: value }
    }));
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.removeItem('vlq-progress');
      window.location.reload();
    }
  };

  // Component definitions
  const ScaleInput = ({ value, onChange, label }) => {
    if (isMobile) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D69E2E 0%, #D69E2E ${(value-1)*11.11}%, #E2E8F0 ${(value-1)*11.11}%, #E2E8F0 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span className="font-medium">Current: {value}</span>
            <span>10</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Not at all {label.toLowerCase()}</span>
          <span>Extremely {label.toLowerCase()}</span>
        </div>
        <div className="flex items-center space-x-2">
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                value === num 
                  ? 'text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={value === num ? { backgroundColor: '#D69E2E' } : {}}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="text-center mt-1 text-sm text-gray-600">Current: {value}</div>
      </div>
    );
  };

  const ExportToolbar = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border no-print">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Export & Share Options</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {isExporting ? 'Generating...' : 'PDF'}
        </button>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
        
        <button
          onClick={exportToJSON}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          Data
        </button>
        
        <button
          onClick={shareResults}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>

        <button
          onClick={resetAllData}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm ml-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );

  const RecoveryDialog = () => {
    if (!showRecovery) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Recover Previous Session?</h3>
          <p className="text-gray-600 mb-4">
            We found a previous session from {savedData?.lastSaved ? new Date(savedData.lastSaved).toLocaleString() : 'recently'}. 
            Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <button
              onClick={recoverData}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Recover Session
            </button>
            <button
              onClick={dismissRecovery}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HomeView = () => (
    <div>
      <RecoveryDialog />
      
      {/* Header */}
      <div style={{ backgroundColor: '#4A5568' }} className="text-white py-12">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-4xl font-bold mb-4">Valued Living Questionnaire</h1>
          <p className="text-lg opacity-90">Assess your values and how consistently you live by them</p>
          {getOverallProgress() > 0 && (
            <div className="mt-4">
              <div className="bg-white bg-opacity-20 rounded-full h-3 max-w-md mx-auto">
                <div 
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getOverallProgress()}%` }}
                ></div>
              </div>
              <p className="text-sm mt-2">Overall Progress: {getOverallProgress()}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ backgroundColor: '#E2E8F0' }} className="py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex space-x-8">
            <button 
              className="px-4 py-2 font-medium border-b-2"
              style={{ color: '#D69E2E', borderColor: '#D69E2E' }}
            >
              Introduction
            </button>
            <button 
              onClick={() => setCurrentView('vlq1')}
              className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              VLQ-1
            </button>
            <button 
              onClick={() => setCurrentView('vlq2')}
              className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              VLQ-2
            </button>
            <button 
              onClick={() => setCurrentView('vlq1-results')}
              className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
              disabled={Object.keys(vlq1Data).length === 0}
            >
              Results
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#4A5568' }}>Introduction</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              The Valued Living Questionnaire helps you identify what's important in your life and assess how consistently your actions align with those values. This tool is often used in Acceptance and Commitment Therapy (ACT) to help individuals clarify their personal values and make choices that enrich their lives.
            </p>
            <p>
              There are two versions of the questionnaire below. You can complete either one or both, depending on your needs.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#D69E2E' }}>VLQ-1: Basic Assessment</h2>
            <p className="text-gray-600 mb-4">
              Rate the importance of different life areas and how consistent your recent actions have been with those values.
            </p>
            <ul className="text-sm text-gray-600 mb-4">
              <li>• 10 core life areas</li>
              <li>• Importance ratings</li>
              <li>• Action consistency ratings</li>
              <li>• ~5 minutes to complete</li>
            </ul>
            <button 
              onClick={() => setCurrentView('vlq1')}
              className="w-full text-white py-2 px-4 rounded transition-colors"
              style={{ backgroundColor: '#D69E2E' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#B7791F'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#D69E2E'}
            >
              Start VLQ-1
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#D69E2E' }}>VLQ-2: Comprehensive Assessment</h2>
            <p className="text-gray-600 mb-4">
              Explore 12 life areas across 6 dimensions for deeper insight into your values and priorities.
            </p>
            <ul className="text-sm text-gray-600 mb-4">
              <li>• 12 life areas including environment & aesthetics</li>
              <li>• 6 dimensions per area</li>
              <li>• Priority selection exercise</li>
              <li>• ~15 minutes to complete</li>
            </ul>
            <button 
              onClick={() => setCurrentView('vlq2')}
              className="w-full text-white py-2 px-4 rounded transition-colors"
              style={{ backgroundColor: '#D69E2E' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#B7791F'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#D69E2E'}
            >
              Start VLQ-2
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#4A5568' }} className="text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="mb-2">© 2025 Valued Living Questionnaire Web Application</p>
          <p className="text-sm opacity-75">Enhanced with export functionality and comprehensive insights.</p>
        </div>
      </div>
    </div>
  );

  const VLQ1View = () => {
    const isImportancePhase = vlq1Phase === 'importance';
    const currentField = isImportancePhase ? 'importance' : 'consistency';
    
    const handleNext = () => {
      if (isImportancePhase) {
        setVlq1Phase('consistency');
      } else {
        setCurrentView('vlq1-results');
      }
    };

    return (
      <div>
        {/* Header */}
        <div style={{ backgroundColor: '#4A5568' }} className="text-white py-8">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h1 className="text-3xl font-bold mb-2">Valued Living Questionnaire</h1>
            <p className="opacity-90">VLQ-1: {isImportancePhase ? 'Importance Ratings' : 'Action Consistency'}</p>
            <div className="mt-4">
              <div className="bg-white bg-opacity-20 rounded-full h-2 max-w-md mx-auto">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${isImportancePhase ? '50%' : '100%'}` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ backgroundColor: '#E2E8F0' }} className="py-4">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex space-x-8">
              <button 
                onClick={() => setCurrentView('home')}
                className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Introduction
              </button>
              <button 
                className="px-4 py-2 font-medium border-b-2"
                style={{ color: '#D69E2E', borderColor: '#D69E2E' }}
              >
                VLQ-1
              </button>
              <button 
                onClick={() => setCurrentView('vlq2')}
                className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                VLQ-2
              </button>
              <button 
                onClick={() => setCurrentView('vlq1-results')}
                className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
                disabled={!vlq1Data || Object.keys(vlq1Data).length === 0}
              >
                Results
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <div style={{ backgroundColor: '#FFF8E1' }} className="p-4 rounded-lg mb-6">
              <p className="text-sm" style={{ color: '#8B5A2B' }}>
                {isImportancePhase 
                  ? "Rate how important each area is to you personally on a scale of 1-10."
                  : "Rate how consistent your actions have been with each of your values during the past week."
                }
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {lifeAreas.map((area, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-medium mb-4" style={{ color: '#4A5568' }}>{area}</h3>
                <ScaleInput
                  value={vlq1Data[index]?.[currentField] || 5}
                  onChange={(value) => updateVlq1(index, currentField, value)}
                  label={isImportancePhase ? 'Important' : 'Consistent'}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={handleNext}
              className="text-white py-3 px-8 rounded-lg transition-colors"
              style={{ backgroundColor: '#D69E2E' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#B7791F'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#D69E2E'}
            >
              {isImportancePhase ? 'Continue to Action Consistency' : 'View Results'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const VLQ1ResultsView = () => {
    const gapAnalysis = calculateGapInsights();
    const { significantGaps, moderateGaps, wellAligned, overInvested } = getGapAnalysis();
    
    const chartData = lifeAreas.map((area, index) => ({
      name: area.split(' ')[0],
      importance: vlq1Data[index]?.importance || 0,
      consistency: vlq1Data[index]?.consistency || 0,
      gap: (vlq1Data[index]?.importance || 0) - (vlq1Data[index]?.consistency || 0)
    }));

    const toggleSection = (section) => {
      setExpandedSection(expandedSection === section ? null : section);
    };

    const getGapColor = (gap) => {
      if (gap >= 4) return 'text-red-600 bg-red-50 border-red-200';
      if (gap >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
      if (gap === 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      if (Math.abs(gap) <= 1) return 'text-green-600 bg-green-50 border-green-200';
      return 'text-blue-600 bg-blue-50 border-blue-200';
    };

    return (
      <div>
        {/* Header */}
        <div style={{ backgroundColor: '#4A5568' }} className="text-white py-8">
          <div className="max-w-6xl mx-auto text-center px-6">
            <h1 className="text-3xl font-bold mb-2">VLQ-1 Results</h1>
            <p className="opacity-90">Your Values Profile with Detailed Insights</p>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ backgroundColor: '#E2E8F0' }} className="py-4">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex space-x-8">
              <button 
                onClick={() => setCurrentView('home')}
                className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Introduction
              </button>
              <button 
                onClick={() => setCurrentView('vlq1')}
                className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                VLQ-1
              </button>
              <button 
                onClick={() => setCurrentView('vlq2')}
                className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                VLQ-2
              </button>
              <button 
                className="px-4 py-2 font-medium border-b-2"
                style={{ color: '#D69E2E', borderColor: '#D69E2E' }}
              >
                Results
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6" id="results-container">
          <ExportToolbar />

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#4A5568' }}>Importance vs. Action Consistency</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} ref={chartRef}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, name === 'importance' ? 'Importance' : 'Consistency']} />
                  <Bar dataKey="importance" fill="#D69E2E" name="importance" />
                  <Bar dataKey="consistency" fill="#4A5568" name="consistency" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#4A5568' }}>Gap Overview</h2>
              <div className="space-y-3">
                {gapAnalysis.slice(0, 5).map((item, index) => (
                  <div key={index} className={`p-3 rounded border ${getGapColor(item.gap)}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.area}</span>
                      <span className="font-semibold">Gap: {item.gap}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Gap Analysis */}
          <div className="space-y-6">
            {/* Priority Areas */}
            {significantGaps.length > 0 && (
              <div className="bg-white border border-orange-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('priority')}
                  className="w-full flex items-center justify-between p-6 bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-orange-900">Priority Areas ({significantGaps.length})</h3>
                      <p className="text-sm text-orange-700">Significant gaps requiring attention</p>
                    </div>
                  </div>
                  {expandedSection === 'priority' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedSection === 'priority' && (
                  <div className="p-6 space-y-4">
                    <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">What This Means:</h4>
                      <p className="text-sm text-orange-700">
                        These areas show the biggest misalignment between what you value and how you're currently living. 
                        Gaps of 3+ points often indicate external barriers, competing priorities, or areas where you might 
                        benefit from developing new skills or strategies.
                      </p>
                    </div>
                    
                    {significantGaps.map((item, index) => (
                      <div key={index} className="border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">{item.area}</h4>
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                            Gap: {item.gap}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{item.insight}</p>
                        <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                          <p className="text-sm text-orange-700">
                            <strong>Recommendation:</strong> Focus on this area first. Identify specific barriers and create small, achievable action steps.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Well-Aligned Areas */}
            {wellAligned.length > 0 && (
              <div className="bg-white border border-green-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('aligned')}
                  className="w-full flex items-center justify-between p-6 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-green-900">Strengths & Successes ({wellAligned.length})</h3>
                      <p className="text-sm text-green-700">Areas where you're living authentically</p>
                    </div>
                  </div>
                  {expandedSection === 'aligned' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedSection === 'aligned' && (
                  <div className="p-6 space-y-4">
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        These areas represent your strengths in values-based living. Consider what works well here that you can apply to areas with larger gaps.
                      </p>
                    </div>
                    
                    {wellAligned.map((item, index) => (
                      <div key={index} className="border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">{item.area}</h4>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                            Well Aligned
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.insight}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Plan */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Your Personalized Action Plan</h3>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">🎯 Start Here (Next 2 weeks)</h4>
                      {significantGaps.length > 0 ? (
                        <p className="text-sm text-purple-700">
                          Focus on: <strong>{significantGaps[0].area}</strong> - Your highest importance area with the largest gap. 
                          Choose one small, specific action you can take this week.
                        </p>
                      ) : (
                        <p className="text-sm text-purple-700">
                          Great alignment! Consider deepening your commitment in your most important areas or exploring new values.
                        </p>
                      )}
                    </div>
                    
                    {moderateGaps.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2">📅 Month 2-3</h4>
                        <p className="text-sm text-purple-700">
                          Address moderate gaps in: {moderateGaps.slice(0, 2).map(item => item.area).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">🔄 Ongoing</h4>
                      <p className="text-sm text-purple-700">
                        Retake this assessment every 3-6 months to track progress and adjust as your values evolve.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-break { page-break-after: always; }
            body { font-size: 12pt; }
            h1, h2, h3 { color: black !important; }
          }
        `}</style>
      </div>
    );
  };

  // VLQ2 views would be similar with enhanced features...
  const VLQ2View = () => {
    const currentArea = vlq2Areas[vlq2CurrentArea];
    
    const handleNext = () => {
      if (vlq2CurrentArea < vlq2Areas.length - 1) {
        setVlq2CurrentArea(vlq2CurrentArea + 1);
      } else {
        setCurrentView('vlq2-priorities');
      }
    };

    const handlePrevious = () => {
      if (vlq2CurrentArea > 0) {
        setVlq2CurrentArea(vlq2CurrentArea - 1);
      }
    };

    return (
      <div>
        {/* Simplified VLQ2 view - same structure as original but with enhanced features */}
        <div style={{ backgroundColor: '#4A5568' }} className="text-white py-8">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h1 className="text-3xl font-bold mb-2">VLQ-2: Comprehensive Assessment</h1>
            <p className="opacity-90">Area {vlq2CurrentArea + 1} of {vlq2Areas.length}</p>
            <div className="mt-4">
              <div className="bg-white bg-opacity-20 rounded-full h-2 max-w-md mx-auto">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((vlq2CurrentArea + 1) / vlq2Areas.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#4A5568' }}>{currentArea}</h2>
            
            <div className="space-y-6">
              {vlq2Dimensions.map(dim => (
                <div key={dim.key}>
                  <h3 className="font-medium text-gray-700 mb-2">{dim.label}</h3>
                  <p className="text-sm text-gray-600 mb-3">{dim.desc}</p>
                  <ScaleInput
                    value={vlq2Data[vlq2CurrentArea]?.[dim.key] || 5}
                    onChange={(value) => updateVlq2(vlq2CurrentArea, dim.key, value)}
                    label={dim.label}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button 
              onClick={handlePrevious}
              disabled={vlq2CurrentArea === 0}
              className="py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: vlq2CurrentArea === 0 ? '#E2E8F0' : '#718096',
                color: 'white'
              }}
            >
              Previous
            </button>
            <button 
              onClick={handleNext}
              className="text-white py-3 px-6 rounded-lg transition-colors"
              style={{ backgroundColor: '#D69E2E' }}
            >
              {vlq2CurrentArea === vlq2Areas.length - 1 ? 'Set Priorities' : 'Next Area'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render based on current view
  const renderView = () => {
    switch(currentView) {
      case 'vlq1': return <VLQ1View />;
      case 'vlq1-results': return <VLQ1ResultsView />;
      case 'vlq2': return <VLQ2View />;
      // Add other VLQ2 views as needed
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F6' }}>
      {renderView()}
    </div>
  );
};

export default VLQApp;