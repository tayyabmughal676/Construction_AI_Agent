import { useState, useRef, useCallback } from 'react';
import { useToast } from '../components/Toast';

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const { showToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech Recognition is not supported in this browser.', 'warning');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      showToast('Voice recording stopped', 'info');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Listening... Speak now', 'info', 'Voice Input Active');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
      showToast('Transcribed voice speech to text', 'success');
    };

    recognition.onerror = () => {
      setIsListening(false);
      showToast('Voice recognition error.', 'error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, onTranscript, showToast]);

  return {
    isListening,
    toggleVoiceInput,
  };
}
