import React, { useState, useRef } from 'react';
import { Mic } from 'lucide-react';
import { requestMicrophoneAccess } from '../utils/micUtils';

interface VoiceRecorderProps {
  onConfirm: (transcript: string) => void;
  buttonClassName?: string;
  inputPlaceholder?: string;
  buttonOnly?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onConfirm, buttonClassName = '', inputPlaceholder = 'Speak or type...', buttonOnly = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Initialize recognition only once
  const getRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
      return rec;
    }
    return null;
  };

  const handleMicClick = async () => {
    setSpeechError('');
    setPendingTranscript(null);
    
    // First, request microphone access with robust permission checks
    const stream = await requestMicrophoneAccess();
    if (!stream) {
      setSpeechError('Microphone access denied. Please check your browser settings.');
      return;
    }
    
    const recognition = getRecognition();
    if (!recognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }
    
    setIsListening(true);
    recognition.start();
    recognition.onresult = (event: any) => {
      const t = event.results[0][0].transcript;
      setPendingTranscript(t);
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      setPendingTranscript(null);
      if (event.error === 'not-allowed') setSpeechError('Microphone access denied. Please allow mic access in your browser settings.');
      else if (event.error === 'no-speech') setSpeechError('No speech detected. Please try again.');
      else if (event.error === 'audio-capture') setSpeechError('No microphone found. Please connect a mic.');
      else if (event.error === 'network') setSpeechError('Network error. Please check your connection.');
      else if (event.error === 'aborted') setSpeechError('Speech recognition aborted. Please try again.');
      else setSpeechError('Speech recognition error. Please check your browser and permissions.');
    };
    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed && pendingTranscript) {
      setTranscript(pendingTranscript);
      setPendingTranscript(null);
      onConfirm(pendingTranscript);
    } else {
      setPendingTranscript(null);
      handleMicClick();
    }
  };

  return (
    <div className={`${buttonOnly ? 'inline-block' : 'w-full flex flex-col items-start'} relative`}>
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex items-center space-x-2 z-10">
          <span className="text-blue-600 font-semibold animate-pulse">Listening...</span>
          <span className="w-3 h-3 rounded-full bg-blue-400 animate-ping"></span>
        </div>
      )}
      {/* Confirmation step after speech recognition */}
      {pendingTranscript ? (
        <div className="flex flex-col items-start w-full mt-2">
          <div className="mb-2 text-gray-700">You said: <span className="font-semibold">"{pendingTranscript}"</span>. Is that correct?</div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
              onClick={() => handleConfirm(true)}
            >✅ Yes</button>
            <button
              className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              onClick={() => handleConfirm(false)}
            >✖️ No</button>
          </div>
        </div>
      ) : (
        <>
          {!buttonOnly && (
            <input
              type="text"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full p-2 border border-white/30 rounded focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm"
            />
          )}
          <button
            type="button"
            className={`${buttonOnly ? '' : 'ml-2'} px-2 py-2 rounded-lg border border-gray-300 flex items-center justify-center ${isListening ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} ${buttonClassName}`}
            onClick={handleMicClick}
            title="Speak"
            disabled={isListening}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
        </>
      )}
      {speechError && (
        <div className="mt-2 text-xs text-red-500 absolute left-0 top-full">{speechError}</div>
      )}
    </div>
  );
};

export default VoiceRecorder; 