import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limit for image uploads
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  app.post('/api/analyze-landmark', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Missing image or mimeType' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            parts: [
              {
                text: 'Identify the primary landmark in this image. Only reply with the name of the landmark, nothing else. If there is no distinct landmark, reply with "Unknown Landmark".',
              },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType,
                },
              },
            ],
          },
        ],
      });

      res.json({ landmark: response.text?.trim() });
    } catch (error: any) {
      console.error('Error analyzing landmark:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze image' });
    }
  });

  app.post('/api/landmark-history', async (req, res) => {
    try {
      const { landmark } = req.body;
      if (!landmark) {
        return res.status(400).json({ error: 'Missing landmark name' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Provide a short, fascinating historical fact or story about ${landmark}. Keep it engaging and concise, perfect for an AR audio guide narration (around 2-3 sentences).`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      res.json({ history: response.text?.trim() });
    } catch (error: any) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch history' });
    }
  });

  app.post('/api/synthesize-audio', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Missing text' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audioBase64: base64Audio });
      } else {
        throw new Error('No audio generated');
      }
    } catch (error: any) {
      console.error('Error synthesizing audio:', error);
      res.status(500).json({ error: error.message || 'Failed to synthesize audio' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
