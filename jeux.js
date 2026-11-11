(function () {
'use strict';

/* ================= RÉGLAGES ================= */
var KINDS = {
  lexique:     { name: 'Lexique',     hint: "Choisir la ou les bonnes orthographes d'un mot" },
  conjugaison: { name: 'Conjugaison', hint: 'Je, tu, il, nous, vous, ils : choisir la bonne forme' },
  grammaire:   { name: 'Grammaire',   hint: 'Homophones, accords, participe passé, -é / -er…' }
};
var KIND_ORDER = ['lexique', 'conjugaison', 'grammaire'];

var LEVELS = {
  1: { name: 'Niveau 1', lvl: 'facile' },
  2: { name: 'Niveau 2', lvl: 'moyen' },
  3: { name: 'Niveau 3', lvl: 'difficile' },
  4: { name: 'Niveau 4', lvl: 'expert' }
};
var LEVEL_ORDER = [1, 2, 3, 4];

// Catégorie du joueur : le handicap retire des niveaux de risque et des étoiles.
var CATEGORIES = {
  1: { name: 'Collégien ou étranger', handicap: 0 },
  2: { name: 'Lycéen ou adulte', handicap: 1 }
};
var CATEGORY_ORDER = [1, 2];

var WIN_THRESHOLD = 100;
var LOSE_THRESHOLD = -30;
var QUESTION_LIMIT = 40;
var MIN_VICTORY_POINTS_FOR_STARS = 100;

// Un facteur de risque par niveau d'étoiles. À partir de 3★, le nombre de
// questions est multiplié pour que la victoire reste atteignable malgré des
// gains plus faibles.
var STAR_FACTORS = [
  { stars: 1, factor: 10,  multiplier: 1 },
  { stars: 2, factor: 1,   multiplier: 1 },
  { stars: 3, factor: 0.5, multiplier: 2 },
  { stars: 4, factor: 0.3, multiplier: 4 },
  { stars: 5, factor: 0.1, multiplier: 6 }
];

/* ================= OUTILS ================= */
function $(id) { return document.getElementById(id); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function shuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function plural(n, word) { return n + ' ' + word + (n > 1 ? 's' : ''); }
// Étoiles pleines et vides, sur le maximum accessible (5 moins le handicap).
function starGlyphs(n, max) { max = max || 5; return '★'.repeat(n) + '☆'.repeat(Math.max(0, max - n)); }
function maxStars(h) { return 5 - (h || 0); }
function factorForStars(n) {
  var hit = STAR_FACTORS.filter(function (s) { return s.stars === clamp(n, 1, 5); })[0];
  return hit ? hit.factor : 10;
}
function multiplierForFactor(f) {
  var hit = STAR_FACTORS.filter(function (s) { return s.factor === f; })[0];
  return hit ? hit.multiplier : 1;
}
// Gain et perte dérivés du facteur : gain × perte reste à peu près constant.
function computeGainLoss(factor) {
  var f = clamp(factor, 0.1, 10);
  return { gain: Math.max(1, Math.round(10 * Math.sqrt(f))), loss: Math.max(1, Math.round(10 / Math.sqrt(f))) };
}

/* ================= QUESTIONS ================= */
// Conjugaison : un élément par couple verbe + temps ; la question (personne,
// pièges) est fabriquée au moment du tirage par conjugaison.js.
var QUESTIONS = [];
// Lexique : lexique-data.js, produit à partir de lexique.tsv.
(window.LEXIQUE || []).forEach(function (q) {
  QUESTIONS.push({ id: 'lexique|' + q.q + '|' + q.o[q.ok[0]], kind: 'lexique', level: q.d, q: q });
});
// Grammaire : un élément par règle (grammaire.js) ; la phrase est fabriquée au
// tirage avec un vocabulaire pris au hasard, les statistiques portent sur la
// règle.
GRAM.RULES.forEach(function (r) {
  QUESTIONS.push({ id: 'grammaire|' + r.id, kind: 'grammaire', level: r.level, rule: r });
});
CONJ.VERBS.forEach(function (v) {
  CONJ.TENSE_ORDER.forEach(function (t) {
    var any = [0, 1, 2, 3, 4, 5].some(function (p) { return CONJ.forms(v, t, p, 'm'); });
    if (any) QUESTIONS.push({ id: 'conjugaison|' + v.inf + '|' + t, kind: 'conjugaison', level: CONJ.TENSES[t].level, verb: v, tense: t });
  });
});
// Temps de chaque niveau, affichés quand seule la conjugaison est cochée.
var LEVEL_TENSES = {};
LEVEL_ORDER.forEach(function (l) {
  LEVEL_TENSES[l] = CONJ.TENSE_ORDER.filter(function (t) { return CONJ.TENSES[t].level === l; })
    .map(function (t) { return CONJ.TENSES[t].name.toLowerCase(); }).join(', ');
});
function countsFor(kinds, level) {
  return QUESTIONS.filter(function (x) { return kinds.indexOf(x.kind) >= 0 && (level == null || x.level === level); }).length;
}

/* ================= COMBINAISONS, RECORDS, ÉTOILES ================= */
// Une combinaison = un ensemble de rubriques + un ensemble de niveaux.
function sortedKinds(k) { return k.slice().sort(function (a, b) { return KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b); }); }
function sortedLevels(l) { return l.slice().sort(function (a, b) { return a - b; }); }
function comboKey(kinds, levels) { return sortedKinds(kinds).join('+') + '|' + sortedLevels(levels).join('+'); }
function comboHtml(kinds, levels) {
  return sortedKinds(kinds).map(function (k) { return '<span class="kind-tag k-' + k + '">' + KINDS[k].name + '</span>'; }).join('') +
    sortedLevels(levels).map(function (l) { return '<span class="lvl-cube lv-' + l + '">' + l + '</span>'; }).join('');
}
// Étoiles du niveau de risque, avant handicap.
function baseStarsFor(r) {
  if (!r || !r.victory) return 0;
  if (r.factor <= 0.1) return 5;
  if (r.factor <= 0.3) return 4;
  if (r.factor <= 0.5) return 3;
  if (r.factor <= 1) return 2;
  return 1;
}
// Étoiles réellement gagnées : le handicap de la catégorie du joueur au moment
// de la partie est retiré.
function starsFor(r) { return Math.max(0, baseStarsFor(r) - ((r && r.handicap) || 0)); }
function handicap() { return CATEGORIES[state.category || 1].handicap; }
// Une victoire bat toujours une non-victoire ; entre deux victoires, le facteur
// le plus petit l'emporte ; sinon le meilleur score, puis le plus petit facteur.
function isBetterRecord(a, b) {
  if (!b) return true;
  if (a.victory && !b.victory) return true;
  if (!a.victory && b.victory) return false;
  if (a.victory && b.victory) return a.factor !== b.factor ? a.factor < b.factor : a.points > b.points;
  return a.points !== b.points ? a.points > b.points : a.factor < b.factor;
}
function totalStarsOf(records) {
  return Object.keys(records).reduce(function (s, k) { return s + starsFor(records[k]); }, 0);
}

/* ================= STOCKAGE (navigateur uniquement) ================= */
var PREFIX = 'orthostar:';
var memoryStore = {};
var lsOk = true;
try { localStorage.setItem(PREFIX + '__test__', '1'); localStorage.removeItem(PREFIX + '__test__'); } catch (e) { lsOk = false; }
function lsGet(k) {
  if (lsOk) { try { return localStorage.getItem(PREFIX + k); } catch (e) {} }
  return Object.prototype.hasOwnProperty.call(memoryStore, PREFIX + k) ? memoryStore[PREFIX + k] : null;
}
function lsSet(k, v) {
  if (lsOk) { try { localStorage.setItem(PREFIX + k, v); return; } catch (e) {} }
  memoryStore[PREFIX + k] = v;
}
function lsDelete(k) {
  if (lsOk) { try { localStorage.removeItem(PREFIX + k); return; } catch (e) {} }
  delete memoryStore[PREFIX + k];
}
function lsKeys(prefix) {
  var full = PREFIX + prefix, out = [];
  if (lsOk) {
    try {
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(full) === 0) out.push(k.slice(PREFIX.length)); }
      return out;
    } catch (e) {}
  }
  return Object.keys(memoryStore).filter(function (k) { return k.indexOf(full) === 0; }).map(function (k) { return k.slice(PREFIX.length); });
}
function loadJson(k, dflt) { try { var raw = lsGet(k); return raw ? JSON.parse(raw) : dflt; } catch (e) { return dflt; } }
function saveJson(k, v) { try { lsSet(k, JSON.stringify(v)); } catch (e) {} }

function loadKnownPlayers() { return loadJson('players_list', []); }
function saveKnownPlayers(l) { saveJson('players_list', l); }
function loadCategory(p) { var c = loadJson('profile:' + p, {}).category; if (c > 2) c = 2; return CATEGORIES[c] ? c : null; }
function saveCategory(p, c) { saveJson('profile:' + p, { category: c }); }
function loadStats(p) { return loadJson('stats:' + p, {}); }
function saveStats(p, s) { saveJson('stats:' + p, s); }
function loadRecords(p) { return loadJson('records:' + p, {}); }
function saveRecords(p, r) { saveJson('records:' + p, r); saveJson('leaderboard:' + p, { name: p, category: loadCategory(p), totalStars: totalStarsOf(r) }); }
function loadLeaderboard() {
  var list = lsKeys('leaderboard:').map(function (k) { return loadJson(k, null); }).filter(Boolean);
  list.sort(function (a, b) { return (b.totalStars || 0) - (a.totalStars || 0); });
  return list;
}

/* ================= ÉTAT ================= */
var state = {
  screen: 'player',
  player: '',
  category: null,
  knownPlayers: loadKnownPlayers(),
  kindSel: null, // une rubrique de KIND_ORDER, ou 'all' pour toutes
  pickSource: 'suggest', // exercice du haut : 'suggest' (tiré au sort), 'custom' (réglé à la main), 'max' (plus rien à proposer)
  levels: { 1: true, 2: false, 3: false, 4: false },
  factor: 10,
  records: {},
  stats: {},
  pool: [],
  activeKinds: [],
  activeLevels: [],
  levelCycle: 0,
  drawReason: null,
  drawLevel: null,
  current: null,
  revealed: false,
  lastCorrect: null,
  lastDelta: 0,
  points: 0,
  gain: 10,
  loss: 10,
  limit: QUESTION_LIMIT,
  pendingEnd: null,
  session: null
};
var app = $('app');

/* ================= ÉCRAN 1 : JOUEUR ================= */
function renderPlayerSelect() {
  state.screen = 'player';
  app.innerHTML =
    '<h2>Qui joue ?</h2>' +
    '<div class="field"><label for="nameInput">Nom du joueur</label>' +
    '<input type="text" id="nameInput" class="text-input" placeholder="Mon nom" autocomplete="off" value="' + esc(state.player) + '">' +
    (state.knownPlayers.length ? '<div class="players">' + state.knownPlayers.map(function (p) {
      return '<button type="button" class="btn player-btn" data-name="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('') + '</div>' : '') +
    '</div>' +
    '<div class="field"><label>Catégorie</label><div class="chips cat-picker" id="catPicker">' + CATEGORY_ORDER.map(function (c) {
      var h = CATEGORIES[c].handicap;
      return '<button type="button" class="chip cat" data-c="' + c + '"><strong>' + CATEGORIES[c].name + '</strong><span>' +
        (h ? '−' + h + ' étoile' + (h > 1 ? 's' : '') : 'Sans handicap') + '</span></button>';
    }).join('') + '</div></div>' +
    '<div class="actions"><button class="btn primary" id="continueBtn" type="button">Continuer</button>' +
    '<button class="btn ghost" id="profileLink" type="button">Voir mon profil</button>' +
    '<button class="btn ghost ranking-only" id="leaderboardLink" type="button">Voir le classement</button></div>';

  var input = $('nameInput');
  function showCategory() {
    Array.prototype.forEach.call(document.querySelectorAll('#catPicker .chip'), function (b) {
      b.classList.toggle('on', +b.getAttribute('data-c') === state.category);
    });
    $('continueBtn').disabled = !state.category;
  }
  // Un joueur connu retrouve sa catégorie enregistrée ; un nouveau joueur doit
  // choisir la sienne.
  var manual = false;
  function syncCategory() {
    var c = loadCategory(state.player.trim());
    if (c) { state.category = c; manual = false; } else if (!manual) state.category = null;
    showCategory();
  }
  input.addEventListener('input', function () { state.player = input.value; input.classList.remove('invalid'); syncCategory(); });
  Array.prototype.forEach.call(document.querySelectorAll('#catPicker .chip'), function (b) {
    b.addEventListener('click', function () { state.category = +b.getAttribute('data-c'); manual = true; $('catPicker').classList.remove('invalid'); showCategory(); });
  });
  function choose(next) {
    var name = state.player.trim();
    if (!name) { input.focus(); input.classList.add('invalid'); return; }
    if (!state.category) { $('catPicker').classList.add('invalid'); return; }
    state.player = name;
    if (state.knownPlayers.indexOf(name) < 0) { state.knownPlayers.push(name); saveKnownPlayers(state.knownPlayers); }
    saveCategory(name, state.category);
    state.records = loadRecords(name);
    saveRecords(name, state.records);
    refreshRanking();
    refreshProfileLabel();
    next();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.player-btn'), function (b) {
    b.addEventListener('click', function () {
      state.player = b.getAttribute('data-name'); input.value = state.player;
      var c = loadCategory(state.player);
      if (c) { state.category = c; choose(renderSetup); } else { state.category = null; showCategory(); }
    });
  });
  syncCategory();
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') choose(renderSetup); });
  $('continueBtn').addEventListener('click', function () { choose(renderSetup); });
  $('profileLink').addEventListener('click', function () { choose(function () { renderSetup(); goTab('profil'); }); });
  $('leaderboardLink').addEventListener('click', function () { goTab('classement'); });
  input.focus();
}

/* ================= ÉCRAN 2 : CONFIGURATION ================= */
// Une seule rubrique, ou toutes : jamais deux.
function setupKinds() { return state.kindSel === 'all' ? KIND_ORDER.slice() : state.kindSel ? [state.kindSel] : []; }
function setupLevels() {
  var kinds = setupKinds();
  return LEVEL_ORDER.filter(function (x) { return state.levels[x] && countsFor(kinds, x) > 0; });
}

function renderSetup() {
  state.screen = 'setup';
  var gl = computeGainLoss(state.factor);
  app.innerHTML =
    // En haut : l'exercice à jouer (tiré au sort à l'arrivée) et Commencer ;
    // dessous, repliés, les réglages personnalisés pour le modifier.
    '<div class="next-box"><div class="next-label" id="pickLabel"></div><div class="next-pick" id="pickSummary"></div>' +
    '<div class="actions"><button class="btn primary big-btn" id="startBtn" type="button">Commencer</button>' +
    '<button class="btn ghost" id="suggestBtn" type="button" title="Tirer un autre exercice conseillé">🎲 Tirer un exo</button></div></div>' +
    '<details class="custom"><summary>Réglages personnalisés</summary>' +
    '<h3>Rubrique <span class="h-note">(une seule, ou toutes)</span></h3><div class="chips" id="kindPicker">' + KIND_ORDER.map(function (k) {
      return '<button type="button" class="chip kind k-' + k + '" data-k="' + k + '">' +
        '<strong>' + KINDS[k].name + '</strong><span>' + KINDS[k].hint + '</span><span class="count" data-count-kind="' + k + '"></span></button>';
    }).join('') +
    '<button type="button" class="chip kind k-all" data-k="all"><strong>Toutes les rubriques</strong><span>Lexique, conjugaison et grammaire mélangés</span><span class="count" data-count-kind="all"></span></button>' +
    '</div>' +
    '<h3>Niveaux de difficulté <span class="h-note">(1 niveau, 2 niveaux consécutifs ou tous les niveaux)</span></h3><div class="chips" id="levelPicker">' + LEVEL_ORDER.map(function (l) {
      return '<button type="button" class="chip level lv-' + l + (state.levels[l] ? ' on' : '') + '" data-l="' + l + '">' +
        '<strong>' + LEVELS[l].name + '</strong><span data-level-desc="' + l + '">' + LEVELS[l].lvl + '</span><span class="count" data-count-level="' + l + '"></span></button>';
    }).join('') +
    '<button type="button" class="chip level lv-all" data-l="all"><strong>Tous les niveaux</strong><span>de 1 à 4</span><span class="count" data-count-level="all"></span></button>' +
    '</div>' +
    '<h3>Facteur de risque</h3>' +
    '<div class="combo-status" id="comboStatus"></div>' +
    '<div class="stars-picker" id="factorPicker">' + STAR_FACTORS.filter(function (s) { return s.stars > handicap(); }).map(function (s) {
      return '<button type="button" class="star-opt' + (state.factor === s.factor ? ' on' : '') + '" data-f="' + s.factor + '">' +
        '<span class="star-glyphs">' + starGlyphs(s.stars - handicap(), maxStars(handicap())) + '</span><span>×' + s.factor + (s.multiplier > 1 ? ' · ' + s.multiplier + '× questions' : '') + '</span></button>';
    }).join('') + '</div>' +
    '<div class="risk-preview"><span class="gain">Bonne réponse <b id="gainPreview">+' + gl.gain + '</b></span>' +
    '<span class="loss">Mauvaise réponse <b id="lossPreview">−' + gl.loss + '</b></span></div></details>';

  $('suggestBtn').addEventListener('click', applySuggestion);
  Array.prototype.forEach.call(document.querySelectorAll('#kindPicker .chip'), function (b) {
    b.addEventListener('click', function () { state.pickSource = 'custom'; state.kindSel = b.getAttribute('data-k'); refreshSetup(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#levelPicker .chip'), function (b) {
    b.addEventListener('click', function () { state.pickSource = 'custom'; clickLevel(b.getAttribute('data-l')); refreshSetup(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#factorPicker .star-opt'), function (b) {
    b.addEventListener('click', function () { state.pickSource = 'custom'; state.factor = parseFloat(b.getAttribute('data-f')); refreshFactor(); });
  });
  $('startBtn').addEventListener('click', startGame);
  applySuggestion();
}

// Sélections de niveaux autorisées : un seul niveau, deux niveaux consécutifs,
// ou tous les niveaux.
function selectedLevels() { return LEVEL_ORDER.filter(function (x) { return state.levels[x]; }); }
function setLevels(list) { LEVEL_ORDER.forEach(function (x) { state.levels[x] = list.indexOf(x) >= 0; }); }
function clickLevel(v) {
  var cur = selectedLevels();
  if (v === 'all') { setLevels(LEVEL_ORDER.slice()); return; }
  var l = +v;
  if (cur.length === LEVEL_ORDER.length) { setLevels([l]); return; }
  if (cur.indexOf(l) >= 0) { setLevels(cur.filter(function (x) { return x !== l; })); return; }
  if (cur.length === 1 && Math.abs(cur[0] - l) === 1) { setLevels([cur[0], l]); return; }
  if (cur.length === 2) {
    if (l === cur[1] + 1) { setLevels([cur[1], l]); return; }
    if (l === cur[0] - 1) { setLevels([l, cur[0]]); return; }
  }
  setLevels([l]);
}

function refreshFactor() {
  Array.prototype.forEach.call(document.querySelectorAll('#factorPicker .star-opt'), function (b) {
    b.classList.toggle('on', parseFloat(b.getAttribute('data-f')) === state.factor);
  });
  var g = computeGainLoss(state.factor);
  $('gainPreview').textContent = '+' + g.gain;
  $('lossPreview').textContent = '−' + g.loss;
  refreshSummary();
}
// Bloc du haut : l'exercice qui sera joué, tiré au sort ou choisi à la main.
function refreshSummary() {
  var kinds = setupKinds(), levels = setupLevels();
  $('pickLabel').textContent = state.pickSource === 'custom' ? 'Ta sélection' : '🎲 Exercice conseillé';
  if (!kinds.length || !levels.length) {
    $('pickSummary').innerHTML = '<span class="muted">Choisis une rubrique et un niveau dans les réglages personnalisés.</span>';
    return;
  }
  var opt = STAR_FACTORS.filter(function (x) { return x.factor === state.factor; })[0];
  $('pickSummary').innerHTML = '<span class="combo">' + comboHtml(kinds, levels) + '</span> ' +
    '<span class="star-glyphs has">' + starGlyphs(opt.stars - handicap(), maxStars(handicap())) + '</span> <span class="muted">(×' + state.factor + ')</span>' +
    (state.pickSource === 'max' ? '<div class="muted">Toutes les lignes ont le maximum d\'étoiles. Bravo ! Choisis librement dans les réglages personnalisés.</div>' : '');
}

// Met à jour les compteurs, affiche le meilleur résultat de la sélection et
// présélectionne le niveau d'étoiles suivant.
// Résumé du contenu d'une sélection : mots de lexique, règles de grammaire,
// verbes de conjugaison.
function contentText(kinds, level) {
  var parts = [];
  if (kinds.indexOf('lexique') >= 0) parts.push(plural(countsFor(['lexique'], level), 'mot'));
  if (kinds.indexOf('grammaire') >= 0) parts.push(plural(countsFor(['grammaire'], level), 'règle'));
  if (kinds.indexOf('conjugaison') >= 0) parts.push(level == null ? CONJ.VERBS.length + ' verbes'
    : CONJ.TENSE_ORDER.filter(function (t) { return CONJ.TENSES[t].level === level; }).length + ' temps');
  return parts.join(' · ');
}
/* Exercice conseillé : une rubrique au hasard, puis une ligne de score au
   hasard parmi les prochaines marches de cette rubrique. */
var LEVEL_SETS = [[1], [2], [3], [4], [1, 2], [2, 3], [3, 4], [1, 2, 3, 4]];
var KIND_SELS = KIND_ORDER.concat(['all']);
function kindsOf(sel) { return sel === 'all' ? KIND_ORDER.slice() : [sel]; }
function lineStars(kinds, levels) { return starsFor(state.records[comboKey(kinds, levels)]); }
// Prochaines marches d'une rubrique : chaque ligne ouverte qui n'a pas encore
// le maximum d'étoiles, avec une étoile de plus que son meilleur résultat. Un
// niveau seul est toujours ouvert ; une paire s'ouvre quand ses deux niveaux
// ont au moins une étoile ; « tous les niveaux » quand les quatre en ont une.
function nextSteps(sel) {
  var kinds = kindsOf(sel), max = maxStars(handicap()), single = {}, out = [];
  LEVEL_ORDER.forEach(function (l) { single[l] = lineStars(kinds, [l]); });
  LEVEL_SETS.forEach(function (lv) {
    if (lv.some(function (l) { return countsFor(kinds, l) === 0; })) return;
    var open = lv.length === 1 || lv.every(function (l) { return single[l] >= 1; });
    var stars = lineStars(kinds, lv);
    if (open && stars < max) out.push({ sel: sel, levels: lv, stars: stars + 1 });
  });
  return out;
}
function suggestion() {
  var sels = shuffle(KIND_SELS);
  for (var i = 0; i < sels.length; i++) {
    var steps = nextSteps(sels[i]);
    if (steps.length) return steps[Math.floor(Math.random() * steps.length)];
  }
  return null;
}
function applySuggestion() {
  var s = suggestion();
  if (!s) { state.pickSource = 'max'; refreshSetup(); return; }
  state.pickSource = 'suggest';
  state.kindSel = s.sel;
  setLevels(s.levels);
  refreshSetup();
  state.factor = factorForStars(s.stars + handicap());
  refreshFactor();
}

function refreshSetup() {
  var kinds = setupKinds(), levels = setupLevels();
  KIND_ORDER.forEach(function (k) {
    document.querySelector('[data-count-kind="' + k + '"]').textContent = k === 'conjugaison'
      ? CONJ.VERBS.length + ' verbes · ' + CONJ.TENSE_ORDER.length + ' temps' : contentText([k], null);
  });
  document.querySelector('[data-count-kind="all"]').textContent = contentText(KIND_ORDER, null);
  Array.prototype.forEach.call(document.querySelectorAll('#kindPicker .chip'), function (b) {
    b.classList.toggle('on', b.getAttribute('data-k') === state.kindSel);
  });
  LEVEL_ORDER.forEach(function (l) {
    document.querySelector('[data-count-level="' + l + '"]').textContent = contentText(kinds, l);
    var conjOnly = kinds.length === 1 && kinds[0] === 'conjugaison';
    document.querySelector('[data-level-desc="' + l + '"]').textContent = conjOnly ? LEVEL_TENSES[l] : LEVELS[l].lvl;
  });
  document.querySelector('[data-count-level="all"]').textContent = contentText(kinds, null);
  var all = selectedLevels().length === LEVEL_ORDER.length;
  Array.prototype.forEach.call(document.querySelectorAll('#levelPicker .chip'), function (b) {
    var v = b.getAttribute('data-l');
    b.classList.toggle('on', v === 'all' ? all : (!all && !!state.levels[+v]));
  });
  var ready = kinds.length > 0 && levels.length > 0;
  $('startBtn').disabled = !ready;
  if (!ready) {
    $('comboStatus').innerHTML = '<span class="muted">' + (kinds.length ? 'Choisis au moins un niveau.' : 'Choisis une rubrique, ou toutes.') + '</span>';
    refreshSummary();
    return;
  }
  var r = state.records[comboKey(kinds, levels)] || null, stars = starsFor(r);
  var cubes = '<span class="combo">' + comboHtml(kinds, levels) + '</span> ';
  if (!r) $('comboStatus').innerHTML = cubes + 'Aucune partie jouée avec cette sélection.';
  else if (r.victory) $('comboStatus').innerHTML = cubes + 'Meilleur niveau : <span class="star-glyphs">' + starGlyphs(stars, maxStars(r.handicap)) + '</span> <span class="muted">(×' + r.factor + ')</span>';
  else $('comboStatus').innerHTML = cubes + 'Pas encore de victoire — meilleur score : <b>' + r.points + ' pts</b>';
  var base = baseStarsFor(r);
  state.factor = factorForStars(clamp(base ? base + 1 : 1, handicap() + 1, 5));
  refreshFactor();
}

/* ================= PARTIE ================= */
function startGame() {
  if (!setupKinds().length || !setupLevels().length) return;
  state.activeKinds = setupKinds();
  state.activeLevels = setupLevels();
  state.pool = QUESTIONS.filter(function (x) { return state.activeKinds.indexOf(x.kind) >= 0 && state.activeLevels.indexOf(x.level) >= 0; });
  var gl = computeGainLoss(state.factor);
  state.gain = gl.gain; state.loss = gl.loss;
  state.limit = QUESTION_LIMIT * multiplierForFactor(state.factor);
  state.stats = loadStats(state.player);
  state.records = loadRecords(state.player);
  resetSession();
  nextQuestion();
  renderQuiz();
}
function resetSession() {
  state.points = 0;
  state.pendingEnd = null;
  state.levelCycle = 0;
  state.conjPerson = 0;
  state.lastTense = null;
  state.lastVerb = null;
  state.tenseCycle = [];
  state.lastRule = null;
  state.session = { correct: 0, wrong: 0, seen: {}, played: 0 };
}

// Poids de tirage d'une question, calculé sur les 10 dernières tentatives de
// CE joueur : plus d'erreurs ou plus longtemps sans la revoir = plus de chances.
// Le poids est multiplié par la priorité de la question (lexique : 2 pour un
// mot à fautes réelles, 0,5 pour un mot à pièges faibles, 1 sinon) tant que
// le joueur n'a pas encore d'historique dessus ; ensuite seul son historique
// compte.
function drawWeight(x) {
  var s = state.stats[x.id];
  if (!s || !s.attempts || !s.attempts.length) return 31 * ((x.q && x.q.p) || 1);
  var fails = s.attempts.filter(function (a) { return !a.correct; }).length;
  var days = (Date.now() - s.attempts[s.attempts.length - 1].ts) / 86400000;
  return 1 + fails * 3 + Math.min(30, days);
}
// Choix du niveau : le plus facile sous 21 points, le plus difficile au-dessus
// de 79, sinon rotation régulière du plus facile au plus difficile.
function pickLevel() {
  var lv = sortedLevels(state.activeLevels);
  if (lv.length === 1) return { level: lv[0], reason: 'unique' };
  if (state.points < 21) return { level: lv[0], reason: 'low' };
  if (state.points > 79) return { level: lv[lv.length - 1], reason: 'high' };
  var level = lv[state.levelCycle % lv.length];
  state.levelCycle++;
  return { level: level, reason: 'rotation' };
}
// Une question ne revient jamais dans la même partie, sauf si toute la
// sélection est épuisée.
// Conjugaison : les personnes s'enchaînent (je, tu, il, nous, vous, ils) et
// le verbe comme le temps changent d'une question à l'autre.
function conjPossible(x) { return x.kind !== 'conjugaison' || !!CONJ.forms(x.verb, x.tense, state.conjPerson, 'm'); }
function conjVaried(x) { return x.kind !== 'conjugaison' || (x.tense !== state.lastTense && x.verb !== state.lastVerb); }
function pickFromLevel(level) {
  var seen = state.session.seen;
  var pool = state.pool.filter(conjPossible);
  // Une règle de grammaire peut revenir dans la partie (avec une autre phrase),
  // mais pas deux fois de suite.
  function fresh(x) { return x.kind === 'grammaire' ? x.id !== state.lastRule : !seen[x.id]; }
  var c = pool.filter(function (x) { return x.level === level && fresh(x) && conjVaried(x); });
  if (!c.length) c = pool.filter(function (x) { return x.level === level && fresh(x); });
  if (!c.length) c = pool.filter(function (x) { return fresh(x) && conjVaried(x); });
  if (!c.length) c = pool.filter(function (x) { return x.level === level && conjVaried(x); });
  if (!c.length) c = pool.slice();
  // Rubriques à égalité : d'abord une rubrique au hasard parmi celles qui ont
  // des questions possibles, puis une question pondérée dans cette rubrique.
  var kinds = KIND_ORDER.filter(function (k) { return c.some(function (x) { return x.kind === k; }); });
  if (kinds.length > 1) {
    var kind = kinds[Math.floor(Math.random() * kinds.length)];
    c = c.filter(function (x) { return x.kind === kind; });
  }
  var w = c.map(drawWeight), total = w.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total;
  for (var i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i]; }
  return c[c.length - 1];
}
// Conjugaison : les temps de tous les niveaux cochés passent à tour de rôle,
// dans un ordre mélangé, sans palier imposé par le score ; le verbe est tiré
// parmi ceux de ce temps.
function nextConjTense(person) {
  var all = CONJ.TENSE_ORDER.filter(function (t) { return state.activeLevels.indexOf(CONJ.TENSES[t].level) >= 0; });
  for (var tries = 0; tries < 2 * all.length + 2; tries++) {
    if (!state.tenseCycle.length) state.tenseCycle = shuffle(all);
    var t = state.tenseCycle.shift();
    var possible = state.pool.some(function (x) { return x.kind === 'conjugaison' && x.tense === t && CONJ.forms(x.verb, t, person, 'm'); });
    if (possible && (t !== state.lastTense || all.length === 1)) return t;
    if (possible && !state.tenseCycle.length) return t;
  }
  return all[0];
}
function pickConj() {
  var t = nextConjTense(state.conjPerson), seen = state.session.seen;
  var base = state.pool.filter(function (x) { return x.kind === 'conjugaison' && x.tense === t && CONJ.forms(x.verb, t, state.conjPerson, 'm'); });
  var c = base.filter(function (x) { return !seen[x.id] && x.verb !== state.lastVerb; });
  if (!c.length) c = base.filter(function (x) { return x.verb !== state.lastVerb; });
  if (!c.length) c = base;
  var w = c.map(drawWeight), total = w.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total;
  for (var i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i]; }
  return c[c.length - 1];
}

function nextQuestion() {
  var p = pickLevel();
  state.drawReason = p.reason; state.drawLevel = p.level;
  var x = pickFromLevel(p.level);
  if (x.kind === 'conjugaison') x = pickConj();
  if (x.kind === 'grammaire') {
    x = { id: x.id, kind: x.kind, level: x.level, rule: x.rule, q: GRAM.make(x.rule) };
    state.lastRule = x.id;
  }
  if (x.kind === 'conjugaison') {
    var g = CONJ.makeQuestion(x.verb, x.tense, state.conjPerson);
    x = { id: x.id, kind: x.kind, level: x.level, verb: x.verb, tense: x.tense, person: state.conjPerson,
      q: { q: g.prompt, o: g.options, ok: g.ok, e: g.explain, r: 'conjugaison' } };
    state.conjPerson = (state.conjPerson + 1) % 6;
    state.lastTense = x.tense; state.lastVerb = x.verb;
  }
  state.current = { x: x, order: shuffle(x.q.o.map(function (_, i) { return i; })), chosen: [] };
  state.revealed = false;
  state.session.played++;
}
function drawHint() {
  var n = LEVELS[state.drawLevel].name;
  if (state.drawReason === 'low') return 'Palier forcé (< 21 pts) · ' + n;
  if (state.drawReason === 'high') return 'Palier forcé (> 79 pts) · ' + n;
  if (state.drawReason === 'unique') return 'Seul niveau sélectionné';
  return 'Rotation régulière · ' + n;
}

function recordAttempt(id, correct) {
  var s = state.stats[id] || { attempts: [] };
  s.attempts.push({ correct: correct, ts: Date.now() });
  if (s.attempts.length > 10) s.attempts.shift();
  state.stats[id] = s;
}

function answer() {
  if (state.revealed) return;
  var cur = state.current, q = cur.x.q;
  if (!cur.chosen.length) return;
  var allGood = cur.chosen.every(function (i) { return q.ok.indexOf(i) >= 0; });
  var correct = allGood && cur.chosen.length === q.ok.length;
  // Seulement une partie des orthographes admises, sans erreur : ni réussite
  // ni échec, le score ne bouge pas.
  state.lastNeutral = allGood && !correct;
  state.revealed = true;
  if (state.lastNeutral) {
    state.lastCorrect = null;
    state.lastDelta = 0;
    if (state.session.played >= state.limit) state.pendingEnd = 'limit';
    renderQuiz();
    return;
  }
  recordAttempt(cur.x.id, correct);
  saveStats(state.player, state.stats);
  if (correct) state.session.correct++; else state.session.wrong++;
  var seen = state.session.seen[cur.x.id] = state.session.seen[cur.x.id] || { correct: 0, wrong: 0, x: cur.x };
  if (correct) seen.correct++; else seen.wrong++;
  state.lastDelta = correct ? state.gain : -state.loss;
  state.points += state.lastDelta;
  state.lastCorrect = correct;
  state.revealed = true;
  if (state.points >= WIN_THRESHOLD) state.pendingEnd = 'victory';
  else if (state.points <= LOSE_THRESHOLD) state.pendingEnd = 'defeat';
  else if (state.session.played >= state.limit) state.pendingEnd = 'limit';
  renderQuiz();
}
function advance() {
  if (state.pendingEnd) { renderResults(state.pendingEnd); return; }
  nextQuestion();
  renderQuiz();
}

// Tableau de conjugaison du verbe à tous les temps, temps simple et temps
// composé correspondant côte à côte ; le temps et la personne de la question
// sont mis en évidence.
var TABLE_ORDER = ['present', 'passeCompose', 'imparfait', 'plusQueParfait', 'passeSimple', 'passeAnterieur',
  'futur', 'futurAnterieur', 'conditionnel', 'conditionnelPasse', 'subjonctif', 'subjonctifPasse', 'imperatif'];
function conjTableHtml(v, asked, askedPerson) {
  return '<h4 class="conj-title">Conjugaison de « ' + esc(v.inf) + ' »</h4><div class="conj-grid">' + TABLE_ORDER.map(function (t) {
    var rows = [];
    for (var p = 0; p < 6; p++) {
      var f = CONJ.forms(v, t, p, 'm');
      if (!f) continue;
      var hit = t === asked && p === askedPerson;
      rows.push('<li' + (hit ? ' class="hit"' : '') + '>' + esc(CONJ.withPronoun(p, f.join(' / '), t)) + '</li>');
    }
    if (!rows.length) return '';
    return '<div class="conj-card' + (t === asked ? ' asked' : '') + ' tc-' + t + '"><div class="tense-tag tt-' + t + '">' +
      CONJ.TENSES[t].name + '</div><ul>' + rows.join('') + '</ul></div>';
  }).join('') + '</div>';
}

// Page de règle : la conjugaison a sa page, par temps ; le reste renvoie à la
// page de grammaire.
var TENSE_ANCHOR = { present: 'present', imperatif: 'imperatif', imparfait: 'imparfait', futur: 'futur',
  conditionnel: 'conditionnel', passeSimple: 'passe-simple', subjonctif: 'subjonctif' };
function ruleUrl(q, tense) {
  if (q.r === 'conjugaison') return '../prepa-dictee-brevet/conjugaison.html#' + (TENSE_ANCHOR[tense] || 'temps-composes');
  return '../prepa-dictee-brevet/grammaire.html#' + q.r;
}

function renderQuiz() {
  state.screen = 'quiz';
  var cur = state.current, x = cur.x, q = x.q, multi = x.kind === 'lexique';
  var ratio = clamp((state.points - LOSE_THRESHOLD) / (WIN_THRESHOLD - LOSE_THRESHOLD), 0, 1) * 100;
  var remaining = Math.max(0, state.limit - state.session.played);
  var question = multi ? esc(q.q) : esc(q.q).replace('___', state.revealed
    ? '<span class="blank ' + (state.lastCorrect ? 'filled-ok' : 'filled-ko') + '">' + q.ok.map(function (i) { return esc(q.o[i]); }).join(' / ') + '</span>'
    : '<span class="blank">______</span>');

  var opts = cur.order.map(function (i, n) {
    var cls = 'opt';
    if (state.revealed) {
      if (q.ok.indexOf(i) >= 0) cls += (state.lastNeutral && cur.chosen.indexOf(i) < 0) ? ' missed' : ' good';
      else if (cur.chosen.indexOf(i) >= 0) cls += ' bad';
    } else if (cur.chosen.indexOf(i) >= 0) cls += ' sel';
    return '<button type="button" class="' + cls + '" data-i="' + i + '"' + (state.revealed ? ' disabled' : '') + '><kbd>' + (n + 1) + '</kbd> ' + esc(q.o[i]) + '</button>';
  }).join('');

  var feedback = '';
  if (state.revealed) {
    var right = q.ok.map(function (i) { return '<b>' + esc(q.o[i]) + '</b>'; }).join(' et ');
    var missed = q.ok.filter(function (i) { return cur.chosen.indexOf(i) < 0; }).map(function (i) { return '<b>' + esc(q.o[i]) + '</b>'; }).join(' et ');
    var next = '<div class="actions"><button class="btn primary" id="nextBtn" type="button">' + (state.pendingEnd ? 'Voir le résultat' : 'Continuer') + '</button></div>';
    // Réponse juste : Continuer vient avant l'explication, pour enchaîner sur
    // téléphone sans faire défiler ; sinon l'explication passe d'abord.
    var early = state.lastCorrect === true;
    feedback = '<div class="feedback ' + (state.lastNeutral ? 'fb-neutral' : state.lastCorrect ? 'fb-ok' : 'fb-ko') + '">' +
      '<div class="fb-title"><span>' + (state.lastNeutral ? '≈ Attention : il existait d\'autres orthographes possibles : ' + missed + '.'
        : state.lastCorrect ? '✓ Bien joué.' : '✗ Réponse : ' + right) + '</span>' +
      '<span class="fb-pts">' + (state.lastNeutral ? '±0' : state.lastDelta > 0 ? '+' + state.lastDelta : '−' + (-state.lastDelta)) + '</span></div>' +
      (state.lastNeutral ? '<div class="muted">Ni réussite ni erreur : le score ne change pas.</div>' : '') +
      (early ? next : '') +
      (Array.isArray(q.e)
        ? '<ul class="explain-list">' + q.e.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>'
        : '<div>' + esc(q.e) + '</div>') +
      '<div><a href="' + ruleUrl(q, x.tense) + '" target="_blank" rel="noopener">Voir la règle</a></div></div>' +
      (early ? '' : next);
  }

  // Le score vient sous la question et les réponses : sur téléphone, on répond
  // sans avoir à faire défiler l'écran.
  var score =
    '<div class="quiz-score"><div class="quiz-top"><div><div class="points ' + (state.points >= 0 ? 'pos' : 'neg') + '">' + (state.points > 0 ? '+' : '') + String(state.points).replace('-', '−') + '</div><div class="muted">points · ' + esc(state.player) + '</div></div>' +
    '<button type="button" class="btn ghost" id="stopBtn">Terminer</button></div>' +
    '<div class="gauge"><div class="gauge-marker" style="left:' + ratio + '%"></div></div>' +
    '<div class="gauge-labels"><span>Défaite −' + (-LOSE_THRESHOLD) + '</span><span>Victoire ' + WIN_THRESHOLD + '</span></div>' +
    '<div class="draw-hint muted">' + drawHint() + ' · ' + plural(remaining, 'question') + ' restante' + (remaining > 1 ? 's' : '') + '</div></div>';

  app.innerHTML =
    '<div class="qcard lv-border-' + x.level + '">' +
    '<div class="qtags"><span class="kind-tag k-' + x.kind + '">' + KINDS[x.kind].name + '</span><span class="lvl-cube lv-' + x.level + '">' + x.level + '</span>' +
    (x.tense ? '<span class="tense-tag tt-' + x.tense + '">' + CONJ.TENSES[x.tense].name + '</span>' : '') +
    // Le nom de la règle mettrait sur la voie : il n'apparaît qu'après la réponse.
    (x.rule && state.revealed ? '<span class="rule-tag">' + esc(x.rule.name) + '</span>' : '') + '</div>' +
    '<div class="question">' + question + '</div>' +
    (state.revealed ? '' : '<div class="muted">' + (multi ? 'Une ou plusieurs bonnes réponses.' : 'Une seule bonne réponse.') + '</div>') +
    '<div class="options" id="options">' + opts + '</div>' +
    (multi && !state.revealed ? '<div class="actions"><button class="btn primary" id="validateBtn" type="button"' + (cur.chosen.length ? '' : ' disabled') + '>Valider</button></div>' : '') +
    feedback + '</div>' + score +
    (state.revealed && x.tense ? conjTableHtml(x.verb, x.tense, x.person) : '');

  $('stopBtn').addEventListener('click', function () { renderResults('stopped'); });
  if ($('nextBtn')) $('nextBtn').addEventListener('click', advance);
  if (!state.revealed) {
    $('options').addEventListener('click', function (e) { var b = e.target.closest('.opt'); if (b) choose(+b.getAttribute('data-i')); });
    if ($('validateBtn')) $('validateBtn').addEventListener('click', answer);
  }
}
function choose(i) {
  var cur = state.current;
  if (cur.x.kind !== 'lexique') { cur.chosen = [i]; answer(); return; }
  var k = cur.chosen.indexOf(i);
  if (k >= 0) cur.chosen.splice(k, 1); else cur.chosen.push(i);
  renderQuiz();
}

/* ================= RÉSULTATS ================= */
function saveRecordFor(mode) {
  var key = comboKey(state.activeKinds, state.activeLevels);
  var cand = { factor: state.factor, points: state.points, victory: mode === 'victory' && state.points >= MIN_VICTORY_POINTS_FOR_STARS,
    handicap: handicap(), kinds: sortedKinds(state.activeKinds), levels: sortedLevels(state.activeLevels) };
  var before = starsFor(state.records[key]);
  if (isBetterRecord(cand, state.records[key] || null)) {
    state.records[key] = cand;
    saveRecords(state.player, state.records);
  }
  return starsFor(state.records[key]) - before;
}

function renderResults(mode) {
  state.screen = 'result';
  var s = state.session, total = s.correct + s.wrong, pct = total ? Math.round(100 * s.correct / total) : 0;
  var labels = { victory: ['Partie gagnée', 'win'], defeat: ['Partie perdue', 'lose'], limit: ['Limite de questions atteinte', 'stop'], stopped: ['Partie interrompue', 'stop'] };
  var newStars = saveRecordFor(mode);

  var byLevel = {}; LEVEL_ORDER.forEach(function (l) { byLevel[l] = { c: 0, w: 0 }; });
  Object.keys(s.seen).forEach(function (id) { var e = s.seen[id]; byLevel[e.x.level].c += e.correct; byLevel[e.x.level].w += e.wrong; });
  var worst = Object.keys(s.seen).map(function (id) { return s.seen[id]; }).filter(function (e) { return e.wrong > 0; })
    .sort(function (a, b) { return b.wrong - a.wrong; }).slice(0, 5);

  app.innerHTML =
    '<div class="result-hero"><div class="status ' + labels[mode][1] + '">' + labels[mode][0] + '</div>' +
    '<div class="big ' + labels[mode][1] + '">' + String(state.points).replace('-', '−') + ' pts</div>' +
    '<div class="muted">' + pct + ' % de réussite · ' + s.correct + ' bonne' + (s.correct > 1 ? 's' : '') + ' réponse' + (s.correct > 1 ? 's' : '') + ' sur ' + total + '</div>' +
    (newStars > 0 ? '<div class="new-stars">+' + newStars + ' ★ — ' + starGlyphs(starsFor(state.records[comboKey(state.activeKinds, state.activeLevels)]), maxStars(handicap())) + '</div>' : '') +
    '</div>' +
    '<div class="breakdown">' + LEVEL_ORDER.map(function (l) {
      var t = byLevel[l], n = t.c + t.w, p = n ? Math.round(100 * t.c / n) : 0;
      return '<div class="bd-row"><span class="lvl-cube lv-' + l + '">' + l + '</span><span class="bd-name">' + LEVELS[l].name + '</span>' +
        '<span class="bd-track"><span class="bd-fill lv-bg-' + l + '" style="width:' + p + '%"></span></span><span class="bd-num">' + (n ? p + ' %' : '—') + '</span></div>';
    }).join('') + '</div>' +
    (worst.length ? '<h3>À revoir en priorité</h3><ul class="worst">' + worst.map(function (e) {
      var q = e.x.q, answerTxt = q.ok.map(function (i) { return q.o[i]; }).join(' / ');
      var line = (e.x.tense ? CONJ.TENSES[e.x.tense].name + ' · ' : e.x.rule ? e.x.rule.name + ' · ' : '') + q.q.replace('___', '[' + answerTxt + ']');
      return '<li><span>' + esc(line) + '</span> <a href="' + ruleUrl(q, e.x.tense) + '" target="_blank" rel="noopener">règle</a></li>';
    }).join('') + '</ul>' : '') +
    // Profil et classement sont dans le menu : ici, seulement reprendre une
    // partie interrompue, ou en commencer une nouvelle depuis les réglages.
    '<div class="actions">' + (mode === 'stopped' ? '<button class="btn primary" id="resumeBtn" type="button">Reprendre où j\'en étais</button>' : '') +
    '<button class="btn ' + (mode === 'stopped' ? 'ghost' : 'primary') + '" id="newGameBtn" type="button">Nouvelle partie</button></div>';

  if ($('resumeBtn')) $('resumeBtn').addEventListener('click', function () { nextQuestion(); renderQuiz(); });
  $('newGameBtn').addEventListener('click', renderSetup);
}

/* ================= PROFIL ================= */
// Profil et classement ont leur propre onglet : ils s'affichent à côté de
// l'écran de jeu sans le remplacer, une partie en cours reste intacte.
function goTab(tab) { if (location.hash !== '#' + tab) location.hash = '#' + tab; else showTab(tab); }
// Un classement n'a de sens qu'à partir de deux joueurs : en dessous, le menu,
// les sous-onglets et les boutons qui y mènent sont masqués.
function rankingOn() { return loadLeaderboard().length >= 2; }
function refreshRanking() { document.body.classList.toggle('no-ranking', !rankingOn()); }
// Le menu affiche le joueur en cours : « Profil Xavier ».
function refreshProfileLabel() {
  var a = document.querySelector('.nav [data-tab="profil"]');
  if (a) a.textContent = hasPlayer() ? 'Profil ' + state.player.trim() : 'Profil';
}
function showTab(tab) {
  refreshRanking();
  if (tab === 'classement' && !rankingOn()) { location.replace('#profil'); return; }
  if (tab === 'profil') renderProfile();
  else if (tab === 'classement') renderLeaderboard();
}
function hasPlayer() { var n = state.player.trim(); return !!n && state.knownPlayers.indexOf(n) >= 0 && !!state.category; }

function renderProfile() {
  var box = $('profileApp');
  if (!hasPlayer()) {
    box.innerHTML = '<p class="muted">Aucun joueur choisi pour l\'instant.</p>' +
      '<div class="actions"><button class="btn primary" id="pickPlayerBtn" type="button">Choisir un joueur</button></div>';
    $('pickPlayerBtn').addEventListener('click', function () { if (state.screen !== 'quiz') renderPlayerSelect(); goTab('jeu'); });
    return;
  }
  var entries = Object.keys(state.records).map(function (k) { return { key: k, r: state.records[k], stars: starsFor(state.records[k]) }; })
    .sort(function (a, b) { return b.stars !== a.stars ? b.stars - a.stars : b.r.points - a.r.points; });
  var total = entries.reduce(function (s, e) { return s + e.stars; }, 0);

  box.innerHTML =
    '<div class="result-hero"><div class="status stop">Profil</div><div class="big">' + esc(state.player) + '</div><div class="muted">' + CATEGORIES[state.category].name + '</div>' +
    '<div class="total-stars">★ ' + total + ' <span class="muted">étoile' + (total > 1 ? 's' : '') + ' au total</span></div>' +
    '<div class="muted">' + entries.length + ' ligne' + (entries.length > 1 ? 's' : '') + ' de score jouée' + (entries.length > 1 ? 's' : '') + ' sur 32</div></div>' +
    (entries.length ? '<div class="profile-list">' + entries.map(function (e) {
      return '<div class="profile-row"><div><div class="combo">' + comboHtml(e.r.kinds, e.r.levels) + '</div>' +
        '<div class="muted">facteur ×' + e.r.factor + (e.r.victory ? ' · victoire' : ' · ' + e.r.points + ' pts') + '</div></div>' +
        '<div class="star-glyphs' + (e.stars ? ' has' : '') + '">' + starGlyphs(e.stars, maxStars(e.r.handicap)) + '</div>' +
        (e.stars === 0 ? '<button type="button" class="btn ghost trash" data-del="' + esc(e.key) + '" title="Supprimer cette ligne">Supprimer</button>' : '<span></span>') + '</div>';
    }).join('') + '</div>' : '<p class="muted">Aucune partie terminée pour l\'instant. Joue une partie pour remplir ton profil !</p>') +
    '<div class="reset-block">' +
    '<button type="button" class="btn ghost" id="purgeBtn">Réinitialiser mes statistiques de questions</button><div id="purgeZone"></div></div>' +
    '<div class="actions"><button class="btn primary" id="playBtn" type="button">' + (state.screen === 'quiz' ? 'Reprendre la partie' : 'Jouer') + '</button>' +
    '<button class="btn ghost" id="playerBtn" type="button">Changer de joueur</button></div>';

  Array.prototype.forEach.call(document.querySelectorAll('.trash'), function (b) {
    b.addEventListener('click', function () { delete state.records[b.getAttribute('data-del')]; saveRecords(state.player, state.records); renderProfile(); });
  });
  $('purgeBtn').addEventListener('click', function () {
    $('purgeZone').innerHTML = '<div class="purge-confirm">Effacer les statistiques de questions de « ' + esc(state.player) + ' » ? ' +
      '<button type="button" class="btn danger" id="purgeYes">Oui, effacer</button> <button type="button" class="btn ghost" id="purgeNo">Annuler</button></div>';
    $('purgeYes').addEventListener('click', function () {
      lsDelete('stats:' + state.player); state.stats = {};
      $('purgeZone').innerHTML = '<p class="ok-msg">Statistiques réinitialisées. Étoiles et records conservés.</p>';
    });
    $('purgeNo').addEventListener('click', function () { $('purgeZone').innerHTML = ''; });
  });
  $('playBtn').addEventListener('click', function () { if (state.screen !== 'quiz') renderSetup(); goTab('jeu'); });
  $('playerBtn').addEventListener('click', function () { renderPlayerSelect(); goTab('jeu'); });
}

/* ================= CLASSEMENT ================= */
function renderLeaderboard() {
  var list = loadLeaderboard();
  $('leaderboardApp').innerHTML =
    '<div class="result-hero"><div class="status stop">Classement</div><div class="big">★ Étoiles</div>' +
    '<div class="muted">' + plural(list.length, 'joueur') + ' classé' + (list.length > 1 ? 's' : '') + ' sur ce navigateur</div></div>' +
    (list.length ? '<div class="profile-list">' + list.map(function (e, i) {
      var me = e.name === state.player.trim();
      return '<div class="profile-row' + (me ? ' me' : '') + '"><div class="lb-name"><span class="lb-rank">' + (i + 1) + '</span>' + esc(e.name) +
        (CATEGORIES[e.category] ? ' <span class="muted">· ' + CATEGORIES[e.category].name + '</span>' : '') + (me ? ' <span class="muted">(toi)</span>' : '') + '</div>' +
        '<div class="star-glyphs has">★ ' + (e.totalStars || 0) + '</div><span></span></div>';
    }).join('') + '</div>' : '<p class="muted">Personne au classement pour l\'instant. Termine une partie pour y apparaître !</p>') +
    '';
}

/* ================= CLAVIER ================= */
document.addEventListener('keydown', function (e) {
  if (state.screen !== 'quiz' || $('jeu').hidden) return;
  if (e.target && e.target.tagName === 'INPUT') return;
  var cur = state.current;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (state.revealed) advance();
    else if (cur.x.kind === 'lexique') answer();
    return;
  }
  if (!state.revealed && /^[1-9]$/.test(e.key)) {
    var n = +e.key - 1;
    if (n < cur.order.length) choose(cur.order[n]);
  }
});

renderPlayerSelect();
window.JEUX = { showTab: showTab };
refreshRanking();
refreshProfileLabel();
})();
