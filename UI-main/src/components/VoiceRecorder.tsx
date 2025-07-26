import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Check, X } from 'lucide-react';

interface VoiceRecorderProps {
  onConfirm: (transcript: string) => void;
  buttonClassName?: string;
  inputPlaceholder?: string;
  showInput?: boolean;
  autoConfirm?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onConfirm, 
  buttonClassName = '', 
  inputPlaceholder = 'Speak or type...',
  showInput = true,
  autoConfirm = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(status.state === 'granted');
      } catch (e) {
        setHasPermission(null);
      }
    } else {
      setHasPermission(null);
    }
  };

  // Initialize recognition with better error handling
  const getRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1;
        
        // Better error handling
        rec.onerror = (event: any) => {
          setIsListening(false);
          setPendingTranscript(null);
          handleSpeechError(event.error);
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = rec;
        return rec;
      }
    }
    return null;
  };

  const handleSpeechError = (error: string) => {
    switch (error) {
      case 'not-allowed':
        setSpeechError('Microphone access denied. Please allow mic access in your browser settings.');
        break;
      case 'no-speech':
        setSpeechError('No speech detected. Please try again.');
        break;
      case 'audio-capture':
        setSpeechError('No microphone found. Please connect a mic.');
        break;
      case 'network':
        setSpeechError('Network error. Please check your connection.');
        break;
      case 'aborted':
        setSpeechError('Speech recognition aborted. Please try again.');
        break;
      case 'service-not-allowed':
        setSpeechError('Speech recognition service not allowed. Please check your browser settings.');
        break;
      default:
        setSpeechError(`Speech recognition error: ${error}. Please check your browser and permissions.`);
    }
  };

  const requestMicrophoneAccess = async (): Promise<boolean> => {
    // Check if in iframe and warn
    if (window.self !== window.top) {
      console.warn('App is running inside an iframe. Ensure the iframe has allow="microphone" and proper sandbox attributes.');
    }
    
    // Check protocol
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setSpeechError('Microphone access requires HTTPS or localhost.');
      return false;
    }
    
    // Check permission state
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'denied') {
          setSpeechError('Microphone access is blocked. Please allow it in your browser settings.');
          return false;
        }
      } catch (e) {
        // Permissions API not available, continue to request
      }
    }
    
    // Request mic access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechError('Microphone access was denied. Please check your browser and OS settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setSpeechError('No microphone was found. Please connect a microphone.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setSpeechError('Microphone is already in use by another application.');
      } else {
        setSpeechError('An unknown error occurred while accessing the microphone.');
      }
      setHasPermission(false);
      return false;
    }
  };

  const handleMicClick = async () => {
    setSpeechError('');
    setPendingTranscript(null);
    
    // Request microphone access first
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) {
      return;
    }
    
    const recognition = getRecognition();
    if (!recognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }
    
    setIsListening(true);
    
    try {
      recognition.start();
      recognition.onresult = (event: any) => {
        const t = event.results[0][0].transcript;
        setPendingTranscript(t);
        setIsListening(false);
        
        // Auto-confirm if enabled
        if (autoConfirm) {
          handleConfirm(true);
        }
      };
    } catch (error) {
      setIsListening(false);
      setSpeechError('Failed to start speech recognition. Please try again.');
    }
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed && pendingTranscript) {
      setTranscript(pendingTranscript);
      setPendingTranscript(null);
      onConfirm(pendingTranscript);
    } else {
      setPendingTranscript(null);
      // Don't automatically restart recording if user says no
    }
  };

  const handleRetry = () => {
    setPendingTranscript(null);
    setSpeechError('');
    handleMicClick();
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranscript(e.target.value);
    if (e.target.value.trim()) {
      onConfirm(e.target.value);
    }
  };

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-start relative">
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-12 flex items-center space-x-2 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-orange-200/50 shadow-lg">
          <span className="text-orange-600 font-semibold animate-pulse">Listening...</span>
          <div className="flex space-x-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      )}
      
      {/* Confirmation step after speech recognition */}
      {pendingTranscript ? (
        <div className="flex flex-col items-start w-full mt-2 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-orange-200/50">
          <div className="mb-3 text-gray-700">
            You said: <span className="font-semibold text-orange-700">"{pendingTranscript}"</span>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center space-x-1"
              onClick={() => handleConfirm(true)}
            >
              <Check className="w-4 h-4" />
              <span>Confirm</span>
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center space-x-1"
              onClick={() => handleConfirm(false)}
            >
              <X className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center space-x-2">
          {showInput && (
            <input
              type="text"
              value={transcript}
              onChange={handleManualInput}
              placeholder={inputPlaceholder}
              className="flex-1 p-3 border border-orange-200/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/70 backdrop-blur-sm text-gray-700 placeholder-gray-500"
            />
          )}
          <button
            type="button"
            className={`px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-center ${
              isListening 
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105' 
                : hasPermission === false
                ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200'
                : 'bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200 hover:scale-105'
            } ${buttonClassName}`}
            onClick={handleMicClick}
            title={hasPermission === false ? "Microphone access denied" : "Click to speak"}
            disabled={isListening}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : hasPermission === false ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
      
      {/* Error display */}
      {speechError && (
        <div className="mt-2 text-sm text-red-500 bg-red-50/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-red-200/50">
          {speechError}
          {pendingTranscript && (
            <button
              onClick={handleRetry}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder; 