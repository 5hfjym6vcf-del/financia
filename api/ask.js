import axios from 'axios';

// In-memory rate limiter — per Vercel instance, resets on cold start.
// Good enough to limit casual abuse; use Upstash/Redis for cross-instance enforcement.
const rateLimitMap = new Map();
const RATE_LIMIT = 20;   // requests
const WINDOW_MS  = 60_000; // per minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// Purge expired entries every 5 minutes to avoid unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// Groq retire régulièrement ses modèles : la famille llama-3.x a été
// décommissionnée et renvoyait un 404 "model_not_found" sur chaque requête,
// ce qui cassait silencieusement tout le chat. En cas de nouvelle panne du
// chat, vérifier d'abord https://api.groq.com/openai/v1/models.
const GROQ_MODEL = 'openai/gpt-oss-120b';

const LANG_NAMES = { fr: 'French', en: 'English', es: 'Spanish', ru: 'Russian', de: 'German' };

function buildSystemPrompt(lang) {
  const language = LANG_NAMES[lang] || 'French';
  return `Tu es Financia, une IA 100% pédagogique en finance personnelle pour les jeunes de 18-30 ans.
Tu expliques simplement le PEA, ETF, assurance-vie, crypto, bourse, CTO (Compte-Titres Ordinaire), LDDS, Livret A — sans jargon, sans conseil personnalisé d'investissement.
Le CTO (Compte-Titres Ordinaire) est un compte d'investissement classique sans avantage fiscal, à ne pas confondre avec autre chose.
Sois clair, concis, friendly et factuel. You MUST reply in ${language} — this is mandatory, regardless of the language of the question.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' });
  }

  const { message, lang } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message' });

  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(lang) },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 2048,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = r?.data?.choices?.[0]?.message?.content?.trim() || "Je n'ai pas compris 🙂";
    return res.json({ text });

  } catch (e) {
    console.error('Groq error:', e?.response?.data || e.message);
    return res.status(500).json({ error: 'Chat error' });
  }
}