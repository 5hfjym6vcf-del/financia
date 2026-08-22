import axios from 'axios';

// Voir la note dans api/ask.js : Groq décommissionne ses modèles, et la
// famille llama-3.x renvoyait un 404. Ici l'échec était invisible (on
// retombe sur les titres d'origine), donc les actus restaient en anglais.
const GROQ_MODEL = 'openai/gpt-oss-120b';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { titles, lang } = req.body || {};
  if (!Array.isArray(titles) || titles.length === 0) {
    return res.status(400).json({ error: 'titles[] requis' });
  }

  // Les titres Alpha Vantage arrivent déjà en anglais : rien à faire dans ce cas.
  if (lang === 'en') {
    return res.status(200).json({ titles });
  }

  const numbered = titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const targetLang = lang === 'es' ? 'espagnol' : lang === 'ru' ? 'russe' : lang === 'de' ? 'allemand' : 'français';

  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'system',
            content:
              `Traduis chaque titre d'article financier en ${targetLang} en maximum 80 caractères. Garde les noms propres, sigles et acronymes en anglais (NYSE, ETF, Fed, GDP, S&P, etc.). Réponds uniquement avec la liste numérotée traduite, même format que l'entrée, rien d'autre.`,
          },
          { role: 'user', content: numbered },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const raw = r?.data?.choices?.[0]?.message?.content?.trim() || '';
    const translated = raw
      .split('\n')
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^\d+\.\s*/, '').trim());

    // Fallback: if parse fails, return originals
    if (translated.length !== titles.length) {
      return res.status(200).json({ titles });
    }

    return res.status(200).json({ titles: translated });
  } catch (e) {
    console.error('[translate] Groq error:', e?.response?.data || e.message);
    return res.status(200).json({ titles }); // graceful fallback
  }
}
