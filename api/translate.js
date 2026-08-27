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
        // gpt-oss est un modèle à raisonnement, et ses tokens de réflexion sont
        // décomptés de max_tokens. À l'effort par défaut, il en consommait 510
        // sur 512 pour six titres : la réponse était tronquée avant d'avoir rien
        // écrit, le contenu revenait vide, et la traduction retombait
        // silencieusement sur les titres anglais. Un seul titre passait, d'où un
        // bug qui n'apparaissait qu'en lot. En effort réduit, la réflexion tombe
        // à une vingtaine de tokens — traduire n'en demande pas davantage.
        reasoning_effort: 'low',
        max_tokens: 700,
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

    // Le repli sur les titres d'origine reste le bon comportement pour le
    // visiteur, mais il ne doit plus être muet : c'est précisément ce silence
    // qui a laissé les actus en anglais sans que rien ne le signale. On trace
    // donc de quoi diagnostiquer sans avoir à reproduire.
    if (translated.length !== titles.length) {
      const fin = r?.data?.choices?.[0]?.finish_reason;
      const reflexion = r?.data?.usage?.completion_tokens_details?.reasoning_tokens;
      console.error(
        `[translate] Analyse impossible : ${translated.length} lignes pour ${titles.length} titres` +
        ` (finish_reason=${fin}, tokens de réflexion=${reflexion}).` +
        ` Réponse : ${JSON.stringify(raw).slice(0, 200)}`
      );
      return res.status(200).json({ titles, degrade: true });
    }

    return res.status(200).json({ titles: translated });
  } catch (e) {
    console.error('[translate] Échec Groq :', e?.response?.data || e.message);
    // Même principe : le visiteur voit les titres d'origine plutôt qu'un vide,
    // mais l'appelant sait que la traduction n'a pas eu lieu.
    return res.status(200).json({ titles, degrade: true });
  }
}
