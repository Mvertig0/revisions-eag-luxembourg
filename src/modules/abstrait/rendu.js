// Dessin des figures en SVG (texte). Aucune couleur écrite en dur : tout passe par currentColor,
// donc la couleur vient de la page (theme.css) et suit le thème clair/sombre.

const RAYON = [10, 13, 16]; // taille petite / moyenne / grande
const ECHELLE = { 1: 1.6, 2: 1.0, 3: 0.85 }; // plus il y a de formes, plus elles sont petites
const POSITIONS = {
  1: [[50, 50]],
  2: [[30, 50], [70, 50]],
  3: [[50, 28], [28, 70], [72, 70]],
};

// Petit point sur le bord de la forme : en haut, en bas à droite ou en bas à gauche (rotation de 120°).
// Trait blanc autour pour qu'il reste visible sur une forme noire.
function point(x, y, r, rotation, remplissage) {
  const a = (-90 + rotation * 120) * (Math.PI / 180);
  const sombre = remplissage === 2; // sur une forme noire, le point est clair pour rester visible
  return `<circle cx="${(x + Math.cos(a) * r * 0.5).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.5).toFixed(1)}" r="${Math.max(3.8, r * 0.3).toFixed(1)}" fill="${sombre ? "var(--abs-fond, #fff)" : "currentColor"}" stroke="${sombre ? "currentColor" : "var(--abs-fond, #fff)"}" stroke-width="1.5"/>`;
}

function forme(type, x, y, r, remplissage) {
  const style =
    remplissage === 0 ? 'fill="none"' : remplissage === 1 ? 'fill="currentColor" fill-opacity="0.4"' : 'fill="currentColor"';
  const trait = 'stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"';
  if (type === 0) return `<circle cx="${x}" cy="${y}" r="${r}" ${style} ${trait}/>`;
  if (type === 1) return `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" ${style} ${trait}/>`;
  const h = r * 1.15;
  return `<polygon points="${x},${y - h} ${x + h},${y + h * 0.8} ${x - h},${y + h * 0.8}" ${style} ${trait}/>`;
}

// Une case de 100×100 : contenu de la figure (ou « ? » si fig est null).
export function contenuCase(fig) {
  // Forme en carrés collés (rotation mentale) : { poly: [[ligne, colonne], …], g: taille de la grille }.
  if (fig && fig.poly) {
    const t = 84 / fig.g;
    return fig.poly.map(([r, c]) => `<rect x="${8 + c * t + 1}" y="${8 + r * t + 1}" width="${t - 2}" height="${t - 2}" rx="2" fill="currentColor"/>`).join("");
  }
  // Motif : 9 emplacements, allumés (carré plein) ou éteints (carré très pâle).
  if (Array.isArray(fig))
    return fig.map((on, k) => {
      const x = 12 + (k % 3) * 28, y = 12 + Math.floor(k / 3) * 28;
      return on
        ? `<rect x="${x}" y="${y}" width="20" height="20" rx="3" fill="currentColor"/>`
        : `<rect x="${x}" y="${y}" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-opacity="0.15"/>`;
    }).join("");
  if (!fig) return '<text x="50" y="62" text-anchor="middle" font-size="40" fill="currentColor" fill-opacity="0.5">?</text>';
  const n = fig.nombre + 1;
  const r = RAYON[fig.taille] * ECHELLE[n];
  return POSITIONS[n].map(([x, y]) => forme(fig.forme, x, y, r, fig.remplissage) + point(x, y, r, fig.rotation, fig.remplissage)).join("");
}

export function caseSvg(fig, taille = 100) {
  return `<svg viewBox="0 0 100 100" width="${taille}" height="${taille}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="1" y="1" width="98" height="98" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.3"/>` +
    contenuCase(fig) + `</svg>`;
}

// Énoncé : matrice 3×3 (9e case « ? ») ou série (6e figure « ? »).
export function enonceSvg(ex, taille = 100) {
  if (ex.type === "intrus") return `<div class="abs-options">${ex.cellules.map((f, i) => `<div class="abs-option"><b>${"ABCDE"[i]}</b>${caseSvg(f, taille)}</div>`).join("")}</div>`;
  if (ex.type === "analogie") {
    const [A, B, C] = ex.cellules, fleche = '<div style="text-align:center;font-size:28px">→</div>';
    return `<div class="abs-analogie" style="display:grid;grid-template-columns:minmax(0,${taille}px) 30px minmax(0,${taille}px);align-items:center;gap:6px;margin:8px 0">` +
      [caseSvg(A, taille), fleche, caseSvg(B, taille), caseSvg(C, taille), fleche, caseSvg(null, taille)].join("") + `</div>`;
  }
  if (ex.type === "rotation") return `<div class="abs-option"><b>Modèle</b>${caseSvg({ poly: ex.ref, g: ex.g }, taille * 1.3)}</div>`;
  if (ex.type === "des3")
    return `<div class="abs-options">${ex.vues.map((v) => cubeSvg(v)).join("")}</div><p>Quel symbole est sur la face opposée à : ${symboleSvg(ex.cible, 40)}</p>`;
  if (ex.type === "pliage")
    return `<div class="abs-options" style="align-items:center">` + ex.etapes.map((e, i) =>
      `<div class="abs-option">${papierSvg(ex.N, e.region, { trous: e.trous, pli: e.pli }, 110)}<span>${e.pli ? `Pli ${i + 1}` : "Feuille percée"}</span></div>`).join("<b>→</b>") + `</div>`;
  if (ex.type === "de") return `<div class="abs-patron">${patronSvg(ex.patron)}</div>`;
  const cases = [...ex.cellules, null];
  const colonnes = ex.type === "serie" ? 6 : 3;
  return `<div class="abs-grille abs-grille-${ex.type}" style="grid-template-columns:repeat(${colonnes},minmax(0,1fr));max-width:${colonnes * (taille + 6)}px">` +
    cases.map((f) => caseSvg(f, taille)).join("") + `</div>`;
}

export function optionsSvg(ex, taille = 90) {
  if (ex.type === "intrus") return "";
  if (ex.type === "des3") return ex.options.map((sy, i) => `<div class="abs-option"><b>${"ABCDE"[i]}</b>${symboleSvg(sy, 70)}</div>`).join("");
  if (ex.type === "rotation") return ex.options.map((c, i) => `<div class="abs-option"><b>${"ABCDE"[i]}</b>${caseSvg({ poly: c, g: ex.g }, taille)}</div>`).join("");
  if (ex.type === "pliage") {
    const tous = []; for (let x = 0; x < ex.N; x++) for (let y = 0; y < ex.N; y++) tous.push([x, y]);
    return ex.options.map((t, i) => `<div class="abs-option"><b>${"ABCDE"[i]}</b>${papierSvg(ex.N, tous, { trous: t }, taille)}</div>`).join("");
  }
  if (ex.type === "de") return ex.options.map((t, i) => `<div class="abs-option"><b>${"ABCDE"[i]}</b>${cubeSvg(t)}</div>`).join("");
  return ex.options.map((f, i) => `<div class="abs-option"><b>${"ABCDE"[i]}</b>${caseSvg(f, taille)}</div>`).join("");
}

// ---------- dé déplié ----------
// Symboles dessinés dans une case de 100×100 (tous symétriques : le sens de rotation n'a pas d'importance).
const SYMBOLE_SVG = {
  cercle: '<circle cx="50" cy="50" r="26" fill="currentColor"/>',
  anneau: '<circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" stroke-width="9"/>',
  "carré": '<rect x="25" y="25" width="50" height="50" fill="currentColor"/>',
  cadre: '<rect x="22" y="22" width="56" height="56" fill="none" stroke="currentColor" stroke-width="9"/>',
  croix: '<path d="M42 18h16v24h24v16H58v24H42V58H18V42h24z" fill="currentColor"/>',
  cible: '<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="50" cy="50" r="10" fill="currentColor"/>',
};

// Patron déplié : les cases posées sur une grille.
export function patronSvg(patron, cote = 46) {
  const w = Math.max(...patron.map((p) => p.c[0])) + 1, h = Math.max(...patron.map((p) => p.c[1])) + 1;
  return `<svg viewBox="0 0 ${w * 100} ${h * 100}" width="${w * cote}" height="${h * cote}" xmlns="http://www.w3.org/2000/svg">` +
    patron.map(({ c: [x, y], symbole }) =>
      `<g transform="translate(${x * 100} ${y * 100})"><rect x="2" y="2" width="96" height="96" fill="none" stroke="currentColor" stroke-width="3"/>${SYMBOLE_SVG[symbole]}</g>`).join("") + `</svg>`;
}

// Cube en perspective : on voit le dessus, la face de gauche et la face de droite.
export function cubeSvg([dessus, gauche, droite], taille = 110) {
  const s = 70, F = [100, 150], a = [-s * 0.866, -s * 0.5], b = [s * 0.866, -s * 0.5], c = [0, -s];
  const add = (...v) => v.reduce((p, q) => [p[0] + q[0], p[1] + q[1]]);
  const mult = (v, k) => [v[0] * k, v[1] * k];
  const face = (nom, P0, X, Y) => {
    const m = [X[0] / 100, X[1] / 100, Y[0] / 100, Y[1] / 100, P0[0], P0[1]].join(" ");
    const pts = [P0, add(P0, X), add(P0, X, Y), add(P0, Y)].map((p) => p.join(",")).join(" ");
    return `<polygon points="${pts}" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>` +
      `<g transform="matrix(${m})">${SYMBOLE_SVG[nom]}</g>`;
  };
  return `<svg viewBox="0 0 200 200" width="${taille}" height="${taille}" xmlns="http://www.w3.org/2000/svg">` +
    face(dessus, add(F, c, a), b, mult(a, -1)) +
    face(gauche, add(F, a, c), mult(a, -1), mult(c, -1)) +
    face(droite, add(F, c), b, mult(c, -1)) + `</svg>`;
}

// Un symbole seul dans un cadre (réponses du dé « face opposée »).
export function symboleSvg(nom, taille = 70) {
  return `<svg viewBox="0 0 100 100" width="${taille}" height="${taille}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="1" y="1" width="98" height="98" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.3"/>${SYMBOLE_SVG[nom]}</svg>`;
}

// ---------- pliage et perçage ----------
// Feuille de N×N emplacements : la zone encore dépliée (region), les trous, et le prochain pli (ligne pointillée + flèche).
export function papierSvg(N, region, { trous = [], pli = null } = {}, taille = 100) {
  const t = 100 / N;
  let s = `<svg viewBox="-6 -6 112 112" width="${taille}" height="${taille}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="3 3"/>`;
  for (const [x, y] of region)
    s += `<rect x="${x * t}" y="${y * t}" width="${t}" height="${t}" fill="currentColor" fill-opacity="0.07" stroke="currentColor" stroke-opacity="0.35"/>`;
  for (const [x, y] of trous) s += `<circle cx="${(x + 0.5) * t}" cy="${(y + 0.5) * t}" r="${t * 0.26}" fill="currentColor"/>`;
  if (pli) {
    const [x1, y1, x2, y2] = pli.ligne.map((v) => v * t);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    const [ax, ay, bx, by] = pli.fleche.map((v) => v * t);
    const d = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / d, uy = (by - ay) / d;
    s += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="currentColor" stroke-width="2.5"/>` +
      `<polygon points="${bx},${by} ${bx - 9 * ux - 5 * uy},${by - 9 * uy + 5 * ux} ${bx - 9 * ux + 5 * uy},${by - 9 * uy - 5 * ux}" fill="currentColor"/>`;
  }
  return s + `</svg>`;
}

// Texte de la question selon le type d'exercice.
export function questionTexte(ex) {
  return {
    matrice: "Quelle figure remplace le « ? » ?", motifs: "Quelle figure remplace le « ? » ?", serie: "Quelle figure remplace le « ? » ?",
    de: "Quel cube obtient-on en pliant ce patron ?", intrus: "Quelle figure est l'intrus ?",
    analogie: "La 1re figure est à la 2e ce que la 3e est à… ?", des3: "Voici le même cube vu sous plusieurs angles.",
    rotation: "Quelle figure est le modèle simplement tourné (sans le retourner) ?", pliage: "La feuille est pliée puis percée. À quoi ressemble-t-elle dépliée ?",
  }[ex.type];
}

// ---------- pour l'application ----------
// Image de chaque réponse (une par option). Pour l'intrus, les 5 figures de l'énoncé sont elles-mêmes les réponses.
export function imagesOptions(ex, taille = 90) {
  switch (ex.type) {
    case "intrus": return ex.cellules.map((f) => caseSvg(f, taille));
    case "des3": return ex.options.map((s) => symboleSvg(s, taille));
    case "rotation": return ex.options.map((c) => caseSvg({ poly: c, g: ex.g }, taille));
    case "pliage": {
      const tous = [];
      for (let x = 0; x < ex.N; x++) for (let y = 0; y < ex.N; y++) tous.push([x, y]);
      return ex.options.map((t) => papierSvg(ex.N, tous, { trous: t }, taille));
    }
    case "de": return ex.options.map((t) => cubeSvg(t, taille));
    default: return ex.options.map((f) => caseSvg(f, taille));
  }
}

// Énoncé à dessiner au-dessus des réponses (vide pour l'intrus).
export const enonceVisible = (ex) => (ex.type === "intrus" ? "" : enonceSvg(ex));
