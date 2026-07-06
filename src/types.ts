export type ScanState = 'idle' | 'uploading' | 'analyzing' | 'fetching_history' | 'synthesizing_audio' | 'done' | 'error';

export interface ScanResult {
  landmark: string;
  history: string;
  audioBase64: string;
  imageUrl: string;
}
