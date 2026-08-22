
// server/server.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const app = express();
 
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
 
const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use(limiter);
 
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));
 
const ensureCacheDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
const TTS_CACHE_DIR = path.join(__dirname, '..', 'cache', 'tts');
ensureCacheDir(TTS_CACHE_DIR);
 
const SYSTEM_PROMPT = `Tu es Financia, une IA 100% pédagogique en finance personnelle pour les jeunes de 18-30 ans.
Tu expliques simplement le PEA, ETF, assurance-vie, crypto, bourse — sans jargon, sans conseil personnalisé d'investissement.
Sois clair, concis, friendly et factuel. Réponds toujours en français sauf si on te demande autre chose.`;
 
// ─────────────────────────────────────────────────────────────
// 1) Chat — API Groq (gratuit)
// ─────────────────────────────────────────────────────────────
app.post('/ask', async (req, res) => {
  const { message, lang = 'fr' } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message' });
 
  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        // Voir api/ask.js : la famille llama-3.x a été retirée par Groq.
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
 
    const text = r?.data?.choices?.[0]?.message?.content?.trim() || "Je n'ai pas compris, reformule stp 🙂";
    return res.json({ text });
 
  } catch (e) {
    console.error('Groq /ask error:', e?.response?.data || e.message);
    return res.status(500).json({ error: 'Chat error' });
  }
});
 
// ─────────────────────────────────────────────────────────────
// 2) TTS ElevenLabs
// ─────────────────────────────────────────────────────────────
app.post('/speak', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'No text' });
 
    const hash = crypto.createHash('sha1').update(`${process.env.VOICE_ID}:${text}`).digest('hex');
    const mp3Path = path.join(TTS_CACHE_DIR, `${hash}.mp3`);
 
    if (fs.existsSync(mp3Path)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return fs.createReadStream(mp3Path).pipe(res);
    }
 
    if (!process.env.ELEVEN_API_KEY || !process.env.VOICE_ID) {
      return res.status(503).json({ error: 'TTS not configured' });
    }
 
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`;
    const { data } = await axios.post(
      url,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.3, similarity_boost: 0.7, style: 0.4, use_speaker_boost: true },
      },
      {
        responseType: 'arraybuffer',
        headers: {
          'xi-api-key': process.env.ELEVEN_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
      }
    );
 
    fs.writeFileSync(mp3Path, data);
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.end(data);
 
  } catch (e) {
    console.error('ElevenLabs /speak error:', e?.response?.data || e.message);
    return res.status(500).json({ error: 'TTS error' });
  }
});
 
// ─────────────────────────────────────────────────────────────
// 3) Capsules audio
// ─────────────────────────────────────────────────────────────
app.get('/capsule-audio', async (req, res) => {
  const text = (req.query.text || '').toString().slice(0, 5000);
  if (!text) return res.status(400).send('Missing text');
 
  if (!process.env.ELEVEN_API_KEY || !process.env.VOICE_ID) {
    return res.status(503).send('TTS not configured');
  }
 
  try {
    const hash = crypto.createHash('sha1').update(`${process.env.VOICE_ID}:${text}`).digest('hex');
    const mp3Path = path.join(TTS_CACHE_DIR, `${hash}.mp3`);
 
    if (fs.existsSync(mp3Path)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return fs.createReadStream(mp3Path).pipe(res);
    }
 
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`;
    const { data } = await axios.post(
      url,
      { text, model_id: "eleven_multilingual_v2" },
      {
        responseType: 'arraybuffer',
        headers: { 'xi-api-key': process.env.ELEVEN_API_KEY, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
 
    fs.writeFileSync(mp3Path, data);
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.end(data);
 
  } catch (e) {
    console.error('ElevenLabs /capsule-audio error:', e?.response?.data || e.message);
    return res.status(500).send('Capsule TTS error');
  }
});
 
// ─────────────────────────────────────────────────────────────
// 4) Fallback
// ─────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});
 
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Financia server up at http://localhost:${PORT}`);
});