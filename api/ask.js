import axios from 'axios';

const SYSTEM_PROMPT = `Tu es Financia, une IA 100% pédagogique en finance personnelle pour les jeunes de 18-30 ans.
Tu expliques simplement le PEA, ETF, assurance-vie, crypto, bourse, CTO (Compte-Titres Ordinaire), LDDS, Livret A — sans jargon, sans conseil personnalisé d'investissement.
Le CTO (Compte-Titres Ordinaire) est un compte d'investissement classique sans avantage fiscal, à ne pas confondre avec autre chose.
Sois clair, concis, friendly et factuel. Réponds toujours en français sauf si on te demande autre chose.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message' });

  try {
    const r = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
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

    const text = r?.data?.choices?.[0]?.message?.content?.trim() || "Je n'ai pas compris 🙂";
    return res.json({ text });

  } catch (e) {
    console.error('Groq error:', e?.response?.data || e.message);
    return res.status(500).json({ error: 'Chat error' });
  }
}