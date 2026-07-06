import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, MapPin } from 'lucide-react';
import { ScanResult } from '../types';

interface ResultProps {
  result: ScanResult;
  onReset: () => void;
}

export function Result({ result, onReset }: ResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (result.audioBase64) {
      const audioUrl = `data:audio/mp3;base64,${result.audioBase64}`;
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
      
      // Auto-play initially
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [result.audioBase64]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mt-6 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-1">
            <MapPin size={18} />
            <span className="text-sm uppercase tracking-wider font-semibold">Identified</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white leading-tight">
            {result.landmark}
          </h2>
        </div>
        
        <button
          onClick={togglePlayback}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
          }`}
        >
          {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="ml-1 fill-current" />}
        </button>
      </div>
      
      <div className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        <p>{result.history}</p>
      </div>
      
      <button
        onClick={onReset}
        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <RotateCcw size={18} />
        <span>Scan Another</span>
      </button>
    </motion.div>
  );
}
