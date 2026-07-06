import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanState } from '../types';

interface ScannerProps {
  onScan: (file: File, imageBase64: string, mimeType: string) => void;
  scanState: ScanState;
  errorMessage?: string;
  imageUrl?: string;
}

export function Scanner({ onScan, scanState, errorMessage, imageUrl }: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // Extract base64 and mime type from data URL
      const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        onScan(file, matches[2], matches[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStatusText = (state: ScanState) => {
    switch (state) {
      case 'analyzing': return 'Recognizing Landmark...';
      case 'fetching_history': return 'Fetching History from Google...';
      case 'synthesizing_audio': return 'Generating Narration...';
      default: return 'Processing...';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[3/4] flex items-center justify-center shadow-2xl ring-1 ring-gray-800">
        <AnimatePresence mode="wait">
          {imageUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img src={imageUrl} alt="Scan preview" className="w-full h-full object-cover" />
              {scanState !== 'done' && scanState !== 'error' && scanState !== 'idle' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="mb-4 text-blue-400"
                  >
                    <Loader2 size={48} />
                  </motion.div>
                  <motion.p
                    key={scanState}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white font-medium text-lg"
                  >
                    {getStatusText(scanState)}
                  </motion.p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-gray-400 p-8 text-center h-full w-full"
            >
              <Camera size={64} className="mb-4 text-gray-500" strokeWidth={1.5} />
              <h3 className="text-xl font-medium text-gray-200 mb-2">Capture a Landmark</h3>
              <p className="text-sm text-gray-500 mb-8 max-w-[250px]">
                Take a photo or upload an image to reveal its history in AR.
              </p>
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2 active:scale-95 transform"
              >
                <Upload size={20} />
                <span>Select Photo</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {scanState === 'error' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-20">
            <p className="text-red-400 font-medium mb-4">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
