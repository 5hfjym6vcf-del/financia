#!/usr/bin/env python3
"""Génère les 5 slides de la story « La BCE relève ses taux », 1080x1920.

FORMAT
Story, donc 9:16 plein écran, et non 4:5 comme les carrousels. Deux
conséquences de mise en page : pas de numérotation « x/n », qui n'a pas de
sens dans une story, et des marges hautes et basses généreuses pour que rien
ne passe sous l'avatar du compte ni sous la barre de réponse d'Instagram.

TIRET CADRATIN
Le texte fourni contenait « sur le moyen terme — mais aussi ». La charte du
projet proscrit le tiret cadratin dans la copie : reformulé, sens inchangé.
"""
import io, os

ICI = os.path.dirname(os.path.abspath(__file__))
VIOLET = '#7C3AED'


def marque(taille):
    return f'''<svg width="{taille}" height="{taille}" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="{VIOLET}"/>
      <g fill="#0A0A0B" shape-rendering="crispEdges">
        <rect x="8" y="6" width="4" height="20"/><rect x="8" y="6" width="16" height="4"/><rect x="8" y="14" width="12" height="4"/>
      </g>
    </svg>'''


GABARIT = '''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>story_bce_slide{n}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 100%; height: 100%; overflow: hidden; background: #000; }}
  body {{ font-family: 'Montserrat', sans-serif; }}

  .slide {{
    width: 1080px; height: 1920px; position: relative; overflow: hidden;
    background: radial-gradient(circle at 50% 8%, #161020 0%, #000000 60%);
    display: flex; flex-direction: column;
    /* 300 px en haut, 340 px en bas : zones où Instagram superpose l'avatar
       du compte et la barre de réponse. Rien de lisible ne doit y tomber. */
    padding: 300px 92px 340px;
  }}
  .grille {{
    position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background-image:
      linear-gradient(rgba(124,58,237,.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,.055) 1px, transparent 1px);
    background-size: 76px 76px;
  }}
  .halo {{
    position: absolute; width: 1000px; height: 1000px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,.22) 0%, transparent 68%);
    top: -320px; left: 50%; transform: translateX(-50%); pointer-events: none;
  }}
  /* Logo en haut, sous la zone d'interface d'Instagram. */
  .coin {{
    position: absolute; top: 168px; left: 0; right: 0;
    display: flex; align-items: center; justify-content: center; gap: 14px;
  }}
  .coin .mot {{ font-size: 32px; font-weight: 800; color: #fff; letter-spacing: -.5px; }}
  .coin .mot span {{ color: {violet}; }}

  .corps {{ position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center; text-align: center; }}

  .label {{ font-size: 26px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase;
            color: #A78BFA; margin-bottom: 34px; }}
  h1 {{ font-size: 92px; font-weight: 800; line-height: 1.06; letter-spacing: -2.5px; color: #fff; }}
  h1 .accent {{ color: {violet}; }}
  .texte {{ margin-top: 48px; font-size: 40px; font-weight: 500; line-height: 1.5;
            color: rgba(255,255,255,.7); max-width: 840px; }}
  .texte b {{ color: #fff; font-weight: 700; }}

{style}
</style>
</head>
<body>
<div class="slide">
  <div class="grille"></div><div class="halo"></div>
  {coin}
  <div class="corps">
{corps}
  </div>
</div>
</body>
</html>
'''

COIN = ('<div class="coin">' + marque(46)
        + '<span class="mot">Financi<span>a</span></span></div>')


def page(n, corps, style='', coin=COIN):
    return GABARIT.format(n=n, corps=corps, style=style, coin=coin, violet=VIOLET)


# ── 1. Accroche ───────────────────────────────────────────────────────────
s1 = page(1, '''    <div class="label">Actualité</div>
    <h1 class="geant">La BCE<br>relève<br><span class="accent">ses taux</span></h1>
    <p class="texte" style="margin-top:54px">Ce que ça change pour toi.</p>
    <div class="date">10 septembre 2026</div>''',
    style='''
  .geant { font-size: 126px; line-height: 1.03; letter-spacing: -4px; text-transform: uppercase; }
  .date { margin-top: 68px; padding: 16px 36px; border-radius: 999px;
          border: 1px solid rgba(124,58,237,.45); background: rgba(124,58,237,.12);
          font-size: 30px; font-weight: 700; color: #A78BFA; letter-spacing: .5px; }''')

# ── 2. Le fait ────────────────────────────────────────────────────────────
s2 = page(2, '''    <div class="label">Le fait</div>
    <div class="stat">+0,25<span class="pt">point</span></div>
    <p class="texte">La BCE relève ses <b>trois taux directeurs</b>. Le taux de dépôt passe à <b>2,5 %</b>, son plus haut niveau depuis mars 2025.</p>
    <div class="quand">Entrée en vigueur le 16 septembre</div>''',
    style='''
  .stat { display: flex; align-items: baseline; gap: 22px; margin: 16px 0 12px;
          font-size: 172px; font-weight: 900; line-height: 1; letter-spacing: -6px;
          color: #7C3AED; text-shadow: 0 26px 76px rgba(124,58,237,.45); }
  .stat .pt { font-size: 52px; font-weight: 700; letter-spacing: -1px; color: rgba(255,255,255,.55); }
  .quand { margin-top: 54px; padding: 16px 34px; border-radius: 999px;
           border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04);
           font-size: 28px; font-weight: 600; color: rgba(255,255,255,.72); }''')

# ── 3. Pourquoi ───────────────────────────────────────────────────────────
s3 = page(3, '''    <div class="label">Pourquoi</div>
    <h1>Pourquoi<br>cette <span class="accent">hausse</span> ?</h1>
    <div class="chiffre"><span class="v">3,3 %</span><span class="l">d'inflation en zone euro</span></div>
    <p class="texte">Portée par la flambée du prix du pétrole, liée aux tensions au Moyen-Orient.</p>''',
    style='''
  .chiffre { margin-top: 56px; padding: 36px 52px; border-radius: 28px;
             border: 1px solid rgba(124,58,237,.5); background: rgba(124,58,237,.11);
             display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .chiffre .v { font-size: 104px; font-weight: 900; letter-spacing: -3px; color: #A78BFA; line-height: 1; }
  .chiffre .l { font-size: 30px; font-weight: 600; color: rgba(255,255,255,.6); }''')

# ── 4. Ce que ça implique ─────────────────────────────────────────────────
# « peut » et « certains » sont conservés du texte d'origine : ce sont eux qui
# empêchent la slide de basculer du constat au conseil.
s4 = page(4, '''    <div class="label">Concrètement</div>
    <h1>Concrètement ?</h1>
    <div class="deux">
      <div class="bloc">
        <span class="ic" aria-hidden="true">&#8599;</span>
        <span class="t">Le crédit</span>
        <span class="d">Un taux directeur plus élevé <b>peut renchérir</b> le crédit immobilier ou le prêt étudiant, sur le moyen terme.</span>
      </div>
      <div class="bloc neuf">
        <span class="ic" aria-hidden="true">&#8599;</span>
        <span class="t">L'épargne</span>
        <span class="d">Mais il peut aussi <b>mieux rémunérer</b> certains produits d'épargne.</span>
      </div>
    </div>''',
    style='''
  .deux { margin-top: 52px; display: flex; flex-direction: column; gap: 26px; width: 100%; }
  .bloc { padding: 40px 40px; border-radius: 28px; text-align: left;
          border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.035);
          display: flex; flex-direction: column; gap: 14px; }
  .bloc.neuf { border-color: rgba(124,58,237,.5); background: rgba(124,58,237,.11); }
  .bloc .ic { font-size: 42px; color: #A78BFA; line-height: 1; }
  .bloc .t { font-size: 40px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .bloc .d { font-size: 32px; font-weight: 500; line-height: 1.45; color: rgba(255,255,255,.68); }
  .bloc .d b { color: #fff; font-weight: 700; }''')

# ── 5. Clôture ────────────────────────────────────────────────────────────
# Le logo est déjà en haut via .coin ; ici il devient le sujet, d'où le retrait
# de l'ancre pour ne pas le doubler.
s5 = page(5, '''    <p class="texte" style="margin:0 0 76px">On en parle plus en détail sur le site.</p>
    <div class="cloture">''' + marque(132) + '''
      <div class="logo-hero">Financi<span class="accent">a</span></div>
      <div class="logo-tagline">financia.cloud</div>
    </div>
    <p class="mention">Contenu informatif, ni conseil ni recommandation.</p>''',
    style='''
  .cloture { display: flex; flex-direction: column; align-items: center; }
  .cloture svg { border-radius: 29px; filter: drop-shadow(0 26px 64px rgba(124,58,237,.42)); }
  .logo-hero { margin-top: 48px; font-size: 132px; font-weight: 800; color: #fff;
               letter-spacing: -3px; line-height: 1; }
  .logo-hero .accent { color: #7C3AED; }
  .logo-tagline { margin-top: 28px; font-size: 32px; font-weight: 600;
                  color: rgba(255,255,255,.4); letter-spacing: .5px; }
  .mention { margin-top: 92px; font-size: 24px; font-weight: 500;
             color: rgba(255,255,255,.32); line-height: 1.5; max-width: 720px; }''',
    coin='')

# ── 6. Renvoi vers l'article ──────────────────────────────────────────────
# Distincte de la clôture : celle-ci pose la marque, celle-là envoie lire.
# D'où la pastille en très grand, une phrase à l'impératif, et une adresse
# traitée comme un bouton plutôt que comme une mention de pied de page.
s6 = page(6, '''    <div class="marque-geante">''' + marque(300) + '''</div>
    <h1 class="appel">Retrouve<br>l'article <span class="accent">complet</span></h1>
    <div class="bouton">financia.cloud/blog</div>''',
    style='''
  .marque-geante svg { border-radius: 66px; filter: drop-shadow(0 34px 90px rgba(124,58,237,.5)); }
  .appel { margin-top: 76px; font-size: 88px; line-height: 1.08; }
  .bouton {
    margin-top: 72px; padding: 30px 56px; border-radius: 999px;
    background: #7C3AED; color: #fff;
    font-size: 38px; font-weight: 800; letter-spacing: -.5px;
    box-shadow: 0 22px 60px rgba(124,58,237,.45);
  }''',
    coin='')

for n, contenu in enumerate([s1, s2, s3, s4, s5, s6], 1):
    io.open(os.path.join(ICI, f'story_bce_slide{n}.html'), 'w', encoding='utf-8').write(contenu)
    print(f'  story_bce_slide{n}.html')
