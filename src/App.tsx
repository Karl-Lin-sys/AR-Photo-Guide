/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scanner } from './components/Scanner';
import { Result } from './components/Result';
import { ScanState, ScanResult } from './types';

export default function App() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async (file: File, imageBase64: string, mimeType: string) => {
    try {
      setImageUrl(URL.createObjectURL(file));
      setErrorMessage('');
      
      // Step 1: Analyze Image
      setScanState('analyzing');
      const analyzeRes = await fetch('/api/analyze-landmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      
      if (!analyzeRes.ok) throw new Error('Failed to analyze image');
      const analyzeData = await analyzeRes.json();
      const landmark = analyzeData.landmark;
      
      if (!landmark || landmark.toLowerCase() === 'unknown landmark') {
        throw new Error("Couldn't identify a distinct landmark in this image.");
      }

      // Step 2: Fetch History
      setScanState('fetching_history');
      const historyRes = await fetch('/api/landmark-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmark }),
      });
      
      if (!historyRes.ok) throw new Error('Failed to fetch history');
      const historyData = await historyRes.json();
      const history = historyData.history;

      // Step 3: Synthesize Audio
      setScanState('synthesizing_audio');
      const audioRes = await fetch('/api/synthesize-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: history }),
      });
      
      if (!audioRes.ok) throw new Error('Failed to generate narration');
      const audioData = await audioRes.json();
      const audioBase64 = audioData.audioBase64;

      setResult({
        landmark,
        history,
        audioBase64,
        imageUrl,
      });
      setScanState('done');

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred');
      setScanState('error');
    }
  };

  const handleReset = () => {
    setScanState('idle');
    setImageUrl('');
    setResult(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-12 px-4 sm:px-6">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">AR Photo Guide</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Discover the history around you</p>
      </header>

      <main className="w-full flex-1 flex flex-col items-center">
        <Scanner
          onScan={handleScan}
          scanState={scanState}
          errorMessage={errorMessage}
          imageUrl={imageUrl}
        />
        
        {scanState === 'done' && result && (
          <Result result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
