// Avis communauté — lecture en direct d'un Google Sheet public (export CSV),
// alimenté par un Google Form. Aucune base de données, aucune clé API :
// juste une URL d'export CSV en lecture seule.
//
// Colonnes attendues dans le Sheet : Horodateur | Nom | Ton avis | Note | publier
// Seules les lignes où "publier" vaut "oui" (insensible à la casse) sont retournées.

// URL issue de Fichier → Partager → Publier sur le Web (le simple partage par
// lien ne suffit pas pour un accès anonyme fiable côté serveur).
// Sheet géré depuis le compte financiacloud@gmail.com.
const PUB_ID = '2PACX-1vTVtvWuOYw1p-aVF0Vjm84cNWLdpAy_cf27ufE1jbvbTSubyAGbaWTGp53cbRuqzz9WncrUER40bOok';
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${PUB_ID}/pub?output=csv`;

// 2 min : assez court pour qu'un avis validé dans le tableur apparaisse
// rapidement — attendre dix minutes sans aucun retour donnait l'impression
// que la modération ne fonctionnait pas — et assez long pour qu'un pic de
// visiteurs ne déclenche pas une lecture du Sheet à chaque requête.
const CACHE_MS = 2 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

// Parseur CSV minimal mais correct : gère les champs entre guillemets
// (virgules, retours à la ligne, guillemets échappés en "") comme le fait
// l'export CSV de Google Sheets.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function fetchAvis() {
  const r = await fetch(CSV_URL);
  if (!r.ok) throw new Error(`Sheet inaccessible (HTTP ${r.status})`);
  const text = await r.text();
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const [header, ...body] = rows;
  const idx = {
    date:    header.findIndex(h => h.toLowerCase().includes('horodateur')),
    prenom:  header.findIndex(h => h.toLowerCase().includes('nom')),
    texte:   header.findIndex(h => h.toLowerCase().includes('avis')),
    note:    header.findIndex(h => h.toLowerCase().includes('note')),
    publier: header.findIndex(h => h.toLowerCase().includes('publier')),
  };

  return body
    .filter(r => (r[idx.publier] || '').trim().toLowerCase() === 'oui')
    .map(r => ({
      prenom: escapeHtml((r[idx.prenom] || '').trim()).slice(0, 60),
      texte: escapeHtml((r[idx.texte] || '').trim()).slice(0, 400),
      note: Math.max(0, Math.min(5, parseInt(r[idx.note], 10) || 0)),
      created_at: (r[idx.date] || '').trim(),
    }))
    .filter(a => a.prenom && a.texte)
    .reverse(); // les réponses de formulaire arrivent en bas du Sheet — plus récent en premier
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_MS) {
    return res.status(200).json(cache.data);
  }

  try {
    const avis = await fetchAvis();
    cache = { data: avis, fetchedAt: now };
    res.status(200).json(avis);
  } catch (err) {
    console.error('[avis]', err.message);
    if (cache.data) return res.status(200).json(cache.data); // sert le cache périmé plutôt qu'une erreur
    res.status(502).json({ error: 'Impossible de charger les avis pour le moment.' });
  }
}
