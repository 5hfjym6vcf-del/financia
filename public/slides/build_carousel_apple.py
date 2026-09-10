#!/usr/bin/env python3
"""Génère les 6 slides du carrousel « Apple change d'ère », 1080x1350.

Reprend le gabarit de build_carousel_logo.py : même fond, même trame, même
pastille de coin, même numérotation. C'est voulu, les deux carrousels doivent
se reconnaître comme venant du même compte.

NOTE SUR LE FORMAT
La demande disait « 1080x1350px, 9:16 ». Les deux ne coïncident pas :
1080x1350 est du 4:5, le 9:16 vaut 1080x1920. La valeur en pixels a été
retenue, c'est aussi celle du carrousel précédent.

TIRETS CADRATINS
Le texte fourni contenait « Apple arrive tard — mais pourrait ». La charte
du projet proscrit le tiret cadratin dans la copie : reformulé avec une
virgule, sens inchangé.
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
<title>carousel_apple_slide{n}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 100%; height: 100%; overflow: hidden; background: #000; }}
  body {{ font-family: 'Montserrat', sans-serif; }}

  .slide {{
    width: 1080px; height: 1350px; position: relative; overflow: hidden;
    background: radial-gradient(circle at 50% 0%, #141018 0%, #000000 62%);
    display: flex; flex-direction: column; padding: 96px 88px;
  }}
  .grille {{
    position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background-image:
      linear-gradient(rgba(124,58,237,.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,.055) 1px, transparent 1px);
    background-size: 72px 72px;
  }}
  .halo {{
    position: absolute; width: 900px; height: 900px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,.20) 0%, transparent 68%);
    top: -340px; left: 50%; transform: translateX(-50%); pointer-events: none;
  }}
  .num {{
    position: absolute; top: 56px; right: 64px; font-size: 22px; font-weight: 600;
    color: rgba(255,255,255,.28); letter-spacing: .5px;
  }}
  .coin {{ position: absolute; top: 52px; left: 64px; display: flex; align-items: center; gap: 12px; }}
  .coin .mot {{ font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.5px; }}
  .coin .mot span {{ color: {violet}; }}

  .corps {{ position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center; text-align: center; }}

  .label {{ font-size: 22px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase;
            color: #A78BFA; margin-bottom: 26px; }}
  h1 {{ font-size: 76px; font-weight: 800; line-height: 1.08; letter-spacing: -2px; color: #fff; }}
  h1 .accent {{ color: {violet}; }}
  .texte {{ margin-top: 38px; font-size: 33px; font-weight: 500; line-height: 1.55;
            color: rgba(255,255,255,.68); max-width: 820px; }}
  .texte b {{ color: #fff; font-weight: 700; }}

{style}
</style>
</head>
<body>
<div class="slide">
  <div class="grille"></div><div class="halo"></div>
  {coin}
  <div class="num">{n}/6</div>
  <div class="corps">
{corps}
  </div>
</div>
</body>
</html>
'''

COIN = ('<div class="coin">' + marque(38)
        + '<span class="mot">Financi<span>a</span></span></div>')


def page(n, corps, style='', coin=COIN):
    return GABARIT.format(n=n, corps=corps, style=style, coin=coin, violet=VIOLET)


# ── 1. Accroche ───────────────────────────────────────────────────────────
s1 = page(1, '''    <div class="label">Actualité</div>
    <h1 class="titre-geant">Apple<br>change <span class="accent">d'ère</span></h1>
    <p class="texte" style="margin-top:44px">Ce qui s'est passé hier à Cupertino.</p>
    <div class="date">9 septembre 2026</div>''',
    style='''
  .titre-geant { font-size: 104px; line-height: 1.02; letter-spacing: -3px; text-transform: uppercase; }
  .date { margin-top: 56px; padding: 12px 28px; border-radius: 999px;
          border: 1px solid rgba(124,58,237,.45); background: rgba(124,58,237,.12);
          font-size: 24px; font-weight: 700; color: #A78BFA; letter-spacing: .5px; }''')

# ── 2. Nouveau dirigeant ──────────────────────────────────────────────────
s2 = page(2, '''    <div class="label">Direction</div>
    <h1>Fin d'une ère</h1>
    <p class="texte"><b>Tim Cook</b> cède la direction générale à <b>John Ternus</b>, jusqu'ici vice-président ingénierie matérielle. Cook devient président exécutif.</p>
    <div class="passation">
      <div class="p-bloc"><span class="p-nom">Tim Cook</span><span class="p-role">Président exécutif</span></div>
      <div class="p-fleche">&#8594;</div>
      <div class="p-bloc neuf"><span class="p-nom">John Ternus</span><span class="p-role">Directeur général</span></div>
    </div>''',
    style='''
  .passation { margin-top: 56px; display: flex; align-items: center; gap: 30px; }
  .p-bloc { display: flex; flex-direction: column; gap: 8px; padding: 26px 30px;
            border-radius: 20px; border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.03); min-width: 300px; }
  .p-bloc.neuf { border-color: rgba(124,58,237,.5); background: rgba(124,58,237,.10); }
  .p-nom { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -.5px; }
  .p-role { font-size: 20px; font-weight: 600; color: rgba(255,255,255,.45); }
  .p-bloc.neuf .p-role { color: #A78BFA; }
  .p-fleche { font-size: 44px; color: rgba(255,255,255,.35); }''')

# ── 3. Le pliable ─────────────────────────────────────────────────────────
s3 = page(3, '''    <div class="label">Produit</div>
    <h1>iPhone Duo,<br>le premier <span class="accent">pliable</span></h1>
    <p class="texte">Disponible dès le <b>23 octobre</b>, autour de <b>2 000 $</b> (environ 1 718 €).</p>
    <div class="chiffres">
      <div class="c"><span class="c-val">7 ans</span><span class="c-lib">après Samsung</span></div>
      <div class="c"><span class="c-val">&lt; 2 %</span><span class="c-lib">du marché mondial</span></div>
      <div class="c neuf"><span class="c-val">~ 1/3</span><span class="c-lib">visé par Apple (IDC)</span></div>
    </div>
    <p class="texte petit">Apple arrive tard, mais pourrait déjà capter un tiers du marché du pliable cette année.</p>''',
    style='''
  .chiffres { margin-top: 50px; display: flex; gap: 22px; }
  .c { width: 268px; padding: 28px 16px; border-radius: 20px;
       border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03);
       display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .c.neuf { border-color: rgba(124,58,237,.5); background: rgba(124,58,237,.10); }
  .c-val { font-size: 40px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .c.neuf .c-val { color: #A78BFA; }
  .c-lib { font-size: 19px; font-weight: 600; color: rgba(255,255,255,.45); text-align: center; line-height: 1.3; }
  .texte.petit { margin-top: 40px; font-size: 27px; }''')

# ── 4. iPhone 18 Pro ──────────────────────────────────────────────────────
s4 = page(4, '''    <div class="label">iPhone 18 Pro</div>
    <h1>Les Pro montent<br>en gamme</h1>
    <ul class="points">
      <li><b>Puce gravée en 2 nanomètres.</b></li>
      <li><b>Ouverture variable</b> sur l'appareil photo.</li>
      <li>Chaque image <b>signée au niveau du capteur</b>, pour prouver l'absence de retouche IA.</li>
      <li>Prix Pro <b>en hausse de 100 $</b>.</li>
    </ul>''',
    style='''
  .points { margin-top: 52px; list-style: none; text-align: left; max-width: 840px; }
  .points li { position: relative; padding-left: 44px; margin-bottom: 30px;
               font-size: 31px; font-weight: 500; line-height: 1.45;
               color: rgba(255,255,255,.68); }
  .points li:last-child { margin-bottom: 0; }
  .points li::before { content: ''; position: absolute; left: 0; top: 17px;
                       width: 20px; height: 4px; border-radius: 2px; background: #7C3AED; }
  .points b { color: #fff; font-weight: 700; }''')

# ── 5. En bourse ──────────────────────────────────────────────────────────
s5 = page(5, '''    <div class="label">En bourse</div>
    <h1>Le marché<br>a apprécié</h1>
    <div class="stat">+16 %</div>
    <p class="texte">Depuis le début de l'année 2026. L'action reste proche de son <b>record historique</b> établi en juillet.</p>''',
    style='''
  .stat { margin: 48px 0 8px; font-size: 176px; font-weight: 900; line-height: 1;
          letter-spacing: -6px; color: #7C3AED;
          text-shadow: 0 24px 70px rgba(124,58,237,.45); }''')

# ── 6. Avertissement et clôture ───────────────────────────────────────────
# Traitement de clôture standard du compte : pastille, wordmark avec le « a »
# violet, financia.cloud en gris. L'avertissement le précède, dans un encadré
# distinct pour qu'il se lise comme une rupture et non comme un slogan.
s6 = page(6, '''    <div class="avert">
      <span class="avert-ic" aria-hidden="true">&#9888;</span>
      <p>La performance passée ne préjuge pas de l'évolution future. Contenu informatif, ni conseil ni recommandation.</p>
    </div>
    <div class="cloture">''' + marque(96) + '''
      <div class="logo-hero">Financi<span class="accent">a</span></div>
      <div class="logo-tagline">financia.cloud</div>
    </div>''',
    style='''
  .avert { display: flex; gap: 20px; align-items: flex-start; text-align: left;
           max-width: 800px; padding: 30px 32px; border-radius: 20px;
           border: 1px solid rgba(124,58,237,.4); background: rgba(124,58,237,.10); }
  .avert-ic { font-size: 34px; line-height: 1.2; }
  .avert p { font-size: 27px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.75); }
  .cloture { margin-top: 96px; display: flex; flex-direction: column; align-items: center; }
  .cloture svg { border-radius: 21px; filter: drop-shadow(0 22px 54px rgba(124,58,237,.4)); }
  .logo-hero { margin-top: 40px; font-size: 116px; font-weight: 800; color: #fff;
               letter-spacing: -2px; line-height: 1; }
  .logo-hero .accent { color: #7C3AED; }
  .logo-tagline { margin-top: 24px; font-size: 27px; font-weight: 600;
                  color: rgba(255,255,255,.4); letter-spacing: .5px; }''',
    coin='')

for n, contenu in enumerate([s1, s2, s3, s4, s5, s6], 1):
    io.open(os.path.join(ICI, f'carousel_apple_slide{n}.html'), 'w',
            encoding='utf-8').write(contenu)
    print(f'  carousel_apple_slide{n}.html')
