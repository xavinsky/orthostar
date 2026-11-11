/* Moteur de conjugaison du jeu.
   Chaque verbe est décrit par sa famille (comme dans les tableaux-types des
   ouvrages de conjugaison) ; les formes sont calculées par temps et par
   personne. Une forme est une liste d'orthographes acceptées : la première
   est l'orthographe traditionnelle, les suivantes des variantes admises
   (rectifications de 1990, verbes à deux conjugaisons). */
(function (root) {
'use strict';

var PERSONS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

var TENSES = {
  present:     { name: 'Présent',             level: 1 },
  imperatif:   { name: 'Impératif présent',   level: 1 },
  imparfait:   { name: 'Imparfait',           level: 2 },
  futur:       { name: 'Futur simple',        level: 2 },
  passeCompose:{ name: 'Passé composé',       level: 2 },
  passeSimple: { name: 'Passé simple',        level: 3 },
  conditionnel:{ name: 'Conditionnel présent',level: 3 },
  plusQueParfait:{ name: 'Plus-que-parfait',  level: 3 },
  passeAnterieur:{ name: 'Passé antérieur',   level: 4 },
  futurAnterieur:{ name: 'Futur antérieur',   level: 4 },
  conditionnelPasse:{ name: 'Conditionnel passé', level: 4 },
  subjonctif:  { name: 'Subjonctif présent',  level: 4 },
  subjonctifPasse:{ name: 'Subjonctif passé', level: 4 }
};
var TENSE_ORDER = ['present', 'imperatif', 'imparfait', 'futur', 'passeCompose', 'passeSimple', 'conditionnel',
  'plusQueParfait', 'passeAnterieur', 'futurAnterieur', 'conditionnelPasse', 'subjonctif', 'subjonctifPasse'];
// Temps composés : temps de l'auxiliaire.
var COMPOUND = { passeCompose: 'present', plusQueParfait: 'imparfait', passeAnterieur: 'passeSimple',
  futurAnterieur: 'futur', conditionnelPasse: 'conditionnel', subjonctifPasse: 'subjonctif' };

var END = {
  imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
  futur: ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
  conditionnel: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
  subjonctif: ['e', 'es', 'e', 'ions', 'iez', 'ent'],
  ps_a: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  ps_i: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
  ps_u: ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
  ps_in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent']
};

function uniq(a) { var o = []; a.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }
function six(f) { return [0, 1, 2, 3, 4, 5].map(f); }
function cross(stems, end) { return uniq(stems.map(function (s) { return s + end; })); }
function lastIndexRe(s, re) { var m, i = -1; re.lastIndex = 0; while ((m = re.exec(s))) i = m.index; return i; }

/* ---------- 1er groupe ---------- */
// fam : er, cer, ger, e (lever), eacute (céder), ll (appeler, jeter),
// eGrave (acheter, geler), oyer, uyer, ayer, envoyer, ier.
function firstGroup(inf, fam) {
  var base = inf.slice(0, -2);
  // Radical devant un e muet (je, tu, il, ils au présent et au subjonctif ;
  // toutes les personnes au futur et au conditionnel).
  function mute() {
    var i;
    switch (fam) {
      case 'e': case 'eGrave': i = lastIndexRe(base, /e/g); return [base.slice(0, i) + 'è' + base.slice(i + 1)];
      case 'eacute': i = lastIndexRe(base, /é/g); return [base.slice(0, i) + 'è' + base.slice(i + 1)];
      case 'll': return [base + base.slice(-1)];
      case 'oyer': case 'uyer': case 'envoyer': return [base.slice(0, -1) + 'i'];
      case 'ayer': return [base.slice(0, -1) + 'i', base];
      default: return [base];
    }
  }
  // Radical devant a ou o : ç pour -cer, ge pour -ger.
  function soft(end) {
    if (/^[aoâ]/.test(end)) {
      if (fam === 'cer') return base.slice(0, -1) + 'ç';
      if (fam === 'ger') return base + 'e';
    }
    return base;
  }
  var m = mute();
  var futStems;
  if (fam === 'envoyer') futStems = [base.slice(0, -2) + 'err'];          // enverr-
  else if (fam === 'eacute') futStems = [base + 'er', m[0] + 'er'];       // céderai / cèderai (1990)
  else futStems = m.map(function (s) { return s + 'er'; });
  var presEnd = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
  var present = six(function (p) { return (p === 3 || p === 4) ? [soft(presEnd[p]) + presEnd[p]] : cross(m, presEnd[p]); });
  return {
    present: present,
    imparfait: six(function (p) { return [soft(END.imparfait[p]) + END.imparfait[p]]; }),
    passeSimple: six(function (p) { return [soft(END.ps_a[p]) + END.ps_a[p]]; }),
    futur: six(function (p) { return cross(futStems, END.futur[p]); }),
    conditionnel: six(function (p) { return cross(futStems, END.conditionnel[p]); }),
    subjonctif: six(function (p) { return (p === 3 || p === 4) ? [base + END.subjonctif[p]] : cross(m, END.subjonctif[p]); }),
    imperatif: [null, present[0], null, present[3], present[4], null],
    pp: base + 'é'
  };
}

/* ---------- Autres verbes : description explicite ---------- */
// spec : pres (6 formes), ps [radical, type], fut (radical), subj [radical
// je/tu/il/ils, radical nous/vous] ou subjFull, imp (radical d'imparfait),
// imper (3 formes tu/nous/vous) ou null pour les dériver, pp.
function build(spec) {
  var pres = spec.pres.map(function (f) { return [].concat(f); });
  var impStem = spec.imp || spec.pres[3].replace(/ons$/, '');
  var subj = spec.subjFull ? spec.subjFull.map(function (f) { return [].concat(f); }) : six(function (p) {
    var a = spec.subj ? spec.subj[0] : spec.pres[5].replace(/ent$/, '');
    var b = spec.subj ? spec.subj[1] : impStem;
    return [((p === 3 || p === 4) ? b : a) + END.subjonctif[p]];
  });
  var futStems = [].concat(spec.fut);
  var psEnd = END['ps_' + spec.ps[1]];
  var imper = spec.imper ? [null, [].concat(spec.imper[0]), null, [].concat(spec.imper[1]), [].concat(spec.imper[2]), null]
    : [null, pres[1].map(function (f) { return spec.imperDropS ? f.replace(/s$/, '') : f; }), null, pres[3], pres[4], null];
  return {
    present: pres,
    imparfait: six(function (p) { return [impStem + END.imparfait[p]]; }),
    passeSimple: six(function (p) { return [spec.ps[0] + psEnd[p]]; }),
    futur: six(function (p) { return cross(futStems, END.futur[p]); }),
    conditionnel: six(function (p) { return cross(futStems, END.conditionnel[p]); }),
    subjonctif: subj,
    imperatif: imper,
    pp: spec.pp,
    ppForms: spec.ppForms
  };
}

/* Familles du 3e groupe, construites à partir d'un préfixe. */
var FAM3 = {
  venir: function (x) { // venir, tenir
    return build({ pres: [x + 'iens', x + 'iens', x + 'ient', x + 'enons', x + 'enez', x + 'iennent'], ps: [x, 'in'],
      fut: x + 'iendr', subj: [x + 'ienn', x + 'en'], pp: x + 'enu' });
  },
  partir: function (r) { // partir (par/part), dormir (dor/dorm), sentir (sen/sent)
    return build({ pres: [r[0] + 's', r[0] + 's', r[0] + 't', r[1] + 'ons', r[1] + 'ez', r[1] + 'ent'], ps: [r[1], 'i'],
      fut: r[2], pp: r[1] + 'i' });
  },
  ouvrir: function (x, pp) { // ouvrir, offrir, cueillir
    return build({ pres: [x + 'e', x + 'es', x + 'e', x + 'ons', x + 'ez', x + 'ent'], ps: [x, 'i'], fut: x + (x === 'cueill' ? 'er' : 'ir'),
      pp: pp, imperDropS: true });
  },
  recevoir: function (x) { // recevoir, apercevoir (x = re, aper)
    return build({ pres: [x + 'çois', x + 'çois', x + 'çoit', x + 'cevons', x + 'cevez', x + 'çoivent'], ps: [x + 'ç', 'u'],
      fut: x + 'cevr', subj: [x + 'çoiv', x + 'cev'], pp: x + 'çu' });
  },
  rendre: function (x) { // rendre, répondre, attendre (x = rend, répond, attend)
    return build({ pres: [x + 's', x + 's', x, x + 'ons', x + 'ez', x + 'ent'], ps: [x, 'i'], fut: x + 'r', pp: x + 'u' });
  },
  prendre: function (x) { // prendre, apprendre, comprendre (x = '', ap, com)
    return build({ pres: [x + 'prends', x + 'prends', x + 'prend', x + 'prenons', x + 'prenez', x + 'prennent'], ps: [x + 'pr', 'i'],
      fut: x + 'prendr', pp: x + 'pris' });
  },
  mettre: function (x) { // mettre, promettre
    return build({ pres: [x + 'mets', x + 'mets', x + 'met', x + 'mettons', x + 'mettez', x + 'mettent'], ps: [x + 'm', 'i'],
      fut: x + 'mettr', pp: x + 'mis' });
  },
  indre: function (x, v) { // peindre (pe), éteindre (éte), craindre (cra), plaindre (pla), joindre (jo) ; v = 'ei' | 'ai' | 'oi'
    var s = x + v.slice(1); // radical sans la voyelle finale du groupe : pe + i -> pei
    return build({ pres: [s + 'ns', s + 'ns', s + 'nt', s + 'gnons', s + 'gnez', s + 'gnent'], ps: [s + 'gn', 'i'],
      fut: s + 'ndr', pp: s + 'nt' });
  }
};

var VERBS = [];
function add(inf, group, family, aux, table, extra) {
  var v = { inf: inf, group: group, family: family, aux: aux, t: table };
  if (extra) for (var k in extra) v[k] = extra[k];
  VERBS.push(v);
}

/* Auxiliaires */
add('être', 0, 'être', 'avoir', build({
  pres: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imp: 'ét', ps: ['f', 'u'], fut: 'ser',
  subjFull: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'], imper: ['sois', 'soyons', 'soyez'], pp: 'été', ppForms: ['été', 'été', 'été', 'été'] }));
add('avoir', 0, 'avoir', 'avoir', build({
  pres: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], ps: ['e', 'u'], fut: 'aur',
  subjFull: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'], imper: ['aie', 'ayons', 'ayez'], pp: 'eu' }));

/* 1er groupe */
[['chanter', 'er'], ['aimer', 'er'], ['placer', 'cer'], ['commencer', 'cer'], ['manger', 'ger'], ['nager', 'ger'],
 ['lever', 'e'], ['mener', 'e'], ['céder', 'eacute'], ['espérer', 'eacute'], ['appeler', 'll'], ['jeter', 'll'],
 ['acheter', 'eGrave'], ['geler', 'eGrave'], ['employer', 'oyer'], ['nettoyer', 'oyer'], ['essuyer', 'uyer'],
 ['payer', 'ayer'], ['envoyer', 'envoyer'], ['étudier', 'ier'], ['crier', 'ier']
].forEach(function (x) { add(x[0], 1, x[1], 'avoir', firstGroup(x[0], x[1])); });

add('aller', 3, 'aller', 'être', build({
  pres: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], ps: ['all', 'a'], fut: 'ir',
  subjFull: ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'], imper: ['va', 'allons', 'allez'], pp: 'allé' }));
// Passé simple d'aller : terminaisons du 1er groupe.
VERBS[VERBS.length - 1].t.passeSimple = six(function (p) { return ['all' + END.ps_a[p]]; });

/* 2e groupe */
['finir', 'choisir', 'grandir'].forEach(function (inf) {
  var b = inf.slice(0, -2);
  add(inf, 2, 'finir', 'avoir', build({ pres: [b + 'is', b + 'is', b + 'it', b + 'issons', b + 'issez', b + 'issent'],
    ps: [b, 'i'], fut: inf, pp: b + 'i' }));
});

/* 3e groupe en -ir */
add('venir', 3, 'venir', 'être', FAM3.venir('v'));
add('tenir', 3, 'venir', 'avoir', FAM3.venir('t'));
add('partir', 3, 'partir', 'être', FAM3.partir(['par', 'part', 'partir']));
add('dormir', 3, 'partir', 'avoir', FAM3.partir(['dor', 'dorm', 'dormir']));
add('sentir', 3, 'partir', 'avoir', FAM3.partir(['sen', 'sent', 'sentir']));
add('courir', 3, 'courir', 'avoir', build({ pres: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], ps: ['cour', 'u'],
  fut: 'courr', pp: 'couru' }));
add('mourir', 3, 'mourir', 'être', build({ pres: ['meurs', 'meurs', 'meurt', 'mourons', 'mourez', 'meurent'], ps: ['mour', 'u'],
  fut: 'mourr', subj: ['meur', 'mour'], pp: 'mort' }));
add('ouvrir', 3, 'ouvrir', 'avoir', FAM3.ouvrir('ouvr', 'ouvert'));
add('offrir', 3, 'ouvrir', 'avoir', FAM3.ouvrir('offr', 'offert'));
add('cueillir', 3, 'ouvrir', 'avoir', FAM3.ouvrir('cueill', 'cueilli'));

/* 3e groupe en -oir */
add('recevoir', 3, 'recevoir', 'avoir', FAM3.recevoir('re'));
add('apercevoir', 3, 'recevoir', 'avoir', FAM3.recevoir('aper'));
add('voir', 3, 'voir', 'avoir', build({ pres: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], ps: ['v', 'i'], fut: 'verr',
  subj: ['voi', 'voy'], pp: 'vu' }));
add('devoir', 3, 'devoir', 'avoir', build({ pres: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], ps: ['d', 'u'], fut: 'devr',
  subj: ['doiv', 'dev'], imper: ['dois', 'devons', 'devez'], pp: 'dû', ppForms: ['dû', 'due', 'dus', 'dues'] }));
add('pouvoir', 3, 'pouvoir', 'avoir', build({ pres: [['peux', 'puis'], 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], ps: ['p', 'u'],
  fut: 'pourr', subjFull: ['puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'], pp: 'pu' }, true));
add('vouloir', 3, 'vouloir', 'avoir', build({ pres: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], ps: ['voul', 'u'],
  fut: 'voudr', subj: ['veuill', 'voul'], imper: ['veuille', 'veuillons', 'veuillez'], pp: 'voulu' }));
add('savoir', 3, 'savoir', 'avoir', build({ pres: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], ps: ['s', 'u'],
  fut: 'saur', subjFull: ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'], imper: ['sache', 'sachons', 'sachez'], pp: 'su' }));

/* 3e groupe en -re */
add('rendre', 3, 'rendre', 'avoir', FAM3.rendre('rend'));
add('répondre', 3, 'rendre', 'avoir', FAM3.rendre('répond'));
add('attendre', 3, 'rendre', 'avoir', FAM3.rendre('attend'));
add('prendre', 3, 'prendre', 'avoir', FAM3.prendre(''));
add('apprendre', 3, 'prendre', 'avoir', FAM3.prendre('ap'));
add('comprendre', 3, 'prendre', 'avoir', FAM3.prendre('com'));
add('mettre', 3, 'mettre', 'avoir', FAM3.mettre(''));
add('promettre', 3, 'mettre', 'avoir', FAM3.mettre('pro'));
add('peindre', 3, 'indre', 'avoir', FAM3.indre('pe', 'ei'));
add('éteindre', 3, 'indre', 'avoir', FAM3.indre('éte', 'ei'));
add('craindre', 3, 'indre', 'avoir', FAM3.indre('cra', 'ai'));
add('plaindre', 3, 'indre', 'avoir', FAM3.indre('pla', 'ai'));
add('joindre', 3, 'indre', 'avoir', FAM3.indre('jo', 'oi'));
add('résoudre', 3, 'résoudre', 'avoir', build({ pres: ['résous', 'résous', 'résout', 'résolvons', 'résolvez', 'résolvent'],
  ps: ['résol', 'u'], fut: 'résoudr', pp: 'résolu' }));
add('suivre', 3, 'suivre', 'avoir', build({ pres: ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'], ps: ['suiv', 'i'],
  fut: 'suivr', pp: 'suivi' }));
add('vivre', 3, 'vivre', 'avoir', build({ pres: ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'], ps: ['véc', 'u'],
  fut: 'vivr', pp: 'vécu' }));
add('lire', 3, 'lire', 'avoir', build({ pres: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], ps: ['l', 'u'], fut: 'lir', pp: 'lu' }));
add('dire', 3, 'dire', 'avoir', build({ pres: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], ps: ['d', 'i'], fut: 'dir', pp: 'dit' }));
add('écrire', 3, 'écrire', 'avoir', build({ pres: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], ps: ['écriv', 'i'],
  fut: 'écrir', pp: 'écrit' }));
add('croire', 3, 'croire', 'avoir', build({ pres: ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'], ps: ['cr', 'u'],
  fut: 'croir', subj: ['croi', 'croy'], pp: 'cru' }));
add('boire', 3, 'boire', 'avoir', build({ pres: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], ps: ['b', 'u'],
  fut: 'boir', subj: ['boiv', 'buv'], pp: 'bu' }));
add('connaître', 3, 'connaître', 'avoir', build({ pres: ['connais', 'connais', ['connaît', 'connait'], 'connaissons', 'connaissez', 'connaissent'],
  ps: ['conn', 'u'], fut: ['connaîtr', 'connaitr'], pp: 'connu' }));
add('rire', 3, 'rire', 'avoir', build({ pres: ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'], ps: ['r', 'i'], fut: 'rir', pp: 'ri' }));
add('conclure', 3, 'conclure', 'avoir', build({ pres: ['conclus', 'conclus', 'conclut', 'concluons', 'concluez', 'concluent'],
  ps: ['concl', 'u'], fut: 'conclur', pp: 'conclu' }));
add('faire', 3, 'faire', 'avoir', build({ pres: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], ps: ['f', 'i'], fut: 'fer',
  subjFull: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'], pp: 'fait' }));

// Devoir ne s'emploie pratiquement pas à l'impératif.
VERBS.filter(function (v) { return v.inf === 'devoir'; })[0].t.imperatif = [null, null, null, null, null, null];
// Pouvoir n'a pas d'impératif.
VERBS.filter(function (v) { return v.inf === 'pouvoir'; })[0].t.imperatif = [null, null, null, null, null, null];

/* ---------- Participe passé et temps composés ---------- */
function ppForms(v) {
  if (v.t.ppForms) return v.t.ppForms;
  var m = v.t.pp, f = m + 'e';
  return [m, f, /[sx]$/.test(m) ? m : m + 's', f + 's'];
}
var AUX = {};
function auxVerb(name) { return AUX[name] || (AUX[name] = VERBS.filter(function (v) { return v.inf === name; })[0]); }

// Formes d'un verbe à un temps donné, pour une personne : liste des
// orthographes acceptées (sans le pronom). gender : 'm' ou 'f' (accord du
// participe avec être).
function forms(v, tense, p, gender) {
  if (COMPOUND[tense]) {
    var aux = auxVerb(v.aux).t[COMPOUND[tense]][p];
    var pf = ppForms(v), plural = p >= 3;
    var pps = v.aux === 'être' ? [pf[(plural ? 2 : 0) + (gender === 'f' ? 1 : 0)]] : [pf[0]];
    var out = [];
    aux.forEach(function (a) { pps.forEach(function (pp) { out.push(a + ' ' + pp); }); });
    return out;
  }
  var t = v.t[tense];
  return t && t[p] ? t[p].slice() : null;
}

// Tableau complet d'un temps (pour l'explication) : « je pris, tu pris… ».
var PRON_TXT = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
function startsWithVowel(s) { return /^[aeéèêiouyh]/i.test(s); }
function withPronoun(p, form, tense) {
  if (tense === 'imperatif') return form;
  var pron = PRON_TXT[p];
  var sub = tense === 'subjonctif' || tense === 'subjonctifPasse';
  var txt = (pron === 'je' && startsWithVowel(form)) ? "j'" + form : pron + ' ' + form;
  if (sub) txt = (/^[aeiouy]/.test(txt) ? "qu'" : 'que ') + txt;
  return txt;
}
function table(v, tense) {
  var out = [];
  for (var p = 0; p < 6; p++) {
    var f = forms(v, tense, p, 'm');
    if (f) out.push(withPronoun(p, f[0], tense));
  }
  return out.join(', ');
}

/* ---------- Questions et pièges ---------- */
var FAMILY_NOTES = {
  'être': 'Auxiliaire être : conjugaison irrégulière à connaître par cœur.',
  avoir: 'Auxiliaire avoir : conjugaison irrégulière à connaître par cœur.',
  er: '1er groupe : terminaisons -e, -es, -e au présent ; -ai, -as, -a au passé simple.',
  cer: 'Verbes en -cer : ç devant a et o (nous plaçons, il plaçait).',
  ger: 'Verbes en -ger : e après le g devant a et o (nous mangeons, il mangeait).',
  e: 'Comme lever : e devient è devant une syllabe muette (je lève, je lèverai).',
  eacute: 'Comme céder : é devient è devant une terminaison muette (je cède) ; au futur, céderai ou cèderai.',
  ll: 'Appeler et jeter doublent la consonne devant un e muet (j\'appelle, je jetterai).',
  eGrave: 'Comme acheter : è devant un e muet, sans doubler la consonne (j\'achète, il gèle).',
  oyer: 'Verbes en -oyer : y devient i devant un e muet (il emploie, il nettoiera).',
  uyer: 'Verbes en -uyer : y devient i devant un e muet (il essuie, il essuiera).',
  ayer: 'Verbes en -ayer : deux orthographes possibles devant un e muet (il paie / il paye).',
  envoyer: 'Envoyer : comme employer, mais futur irrégulier (j\'enverrai).',
  ier: 'Verbes en -ier : radical en i, d\'où deux i à l\'imparfait et au subjonctif (nous étudiions).',
  aller: 'Aller : 3e groupe, très irrégulier (je vais, j\'irai, que j\'aille).',
  finir: '2e groupe : -iss- au pluriel du présent, à l\'imparfait et au subjonctif.',
  venir: 'Venir, tenir : passé simple en -ins (il vint), futur en -iendr- (je viendrai).',
  partir: 'Partir, dormir, sentir : la dernière consonne du radical tombe au singulier du présent (je pars, je dors).',
  courir: 'Courir : deux r au futur et au conditionnel (je courrai).',
  mourir: 'Mourir : je meurs, deux r au futur (je mourrai), auxiliaire être.',
  ouvrir: 'Ouvrir, offrir, cueillir : terminaisons du 1er groupe au présent (j\'ouvre) ; cueillir fait je cueillerai.',
  recevoir: 'Verbes en -cevoir : ç devant o et u (je reçois, il reçut).',
  voir: 'Voir : futur je verrai ; y devant une voyelle prononcée (nous voyons, nous voyions).',
  devoir: 'Devoir : participe dû, avec accent seulement au masculin singulier.',
  pouvoir: 'Pouvoir : je peux (ou je puis), futur je pourrai, subjonctif que je puisse.',
  vouloir: 'Vouloir : je veux, futur je voudrai, subjonctif que je veuille.',
  savoir: 'Savoir : futur je saurai, subjonctif que je sache.',
  rendre: 'Verbes en -dre : le d reste au singulier du présent (il rend, il répond).',
  prendre: 'Prendre : nous prenons, ils prennent ; passé simple il prit, participe pris.',
  mettre: 'Mettre : il met ; passé simple il mit, participe mis.',
  indre: 'Verbes en -indre : pas de d au présent (il peint) ; -gn- devant une voyelle (nous peignons).',
  'résoudre': 'Résoudre : il résout (t), nous résolvons, participe résolu.',
  suivre: 'Suivre : je suis (comme être), il suivit, participe suivi.',
  vivre: 'Vivre : passé simple il vécut, participe vécu.',
  lire: 'Lire : passé simple il lut, participe lu.',
  dire: 'Dire : vous dites ; passé simple il dit, participe dit.',
  'écrire': 'Écrire : nous écrivons, il écrivit, participe écrit.',
  croire: 'Croire : nous croyons, nous croyions ; passé simple il crut.',
  boire: 'Boire : nous buvons, ils boivent ; passé simple il but.',
  'connaître': 'Connaître : î devant t (il connaît) ; sans accent, connait est aussi admis.',
  rire: 'Rire : nous rions, nous riions à l\'imparfait.',
  conclure: 'Conclure : il conclut (t), participe conclu.',
  faire: 'Faire : vous faites, ils font, je ferai, que je fasse.'
};

// Temps faciles à confondre avec le temps demandé.
var CONFUSE = {
  present: ['subjonctif', 'imparfait'], imperatif: ['present'], imparfait: ['passeSimple', 'present'],
  futur: ['conditionnel'], conditionnel: ['futur', 'imparfait'], passeSimple: ['imparfait', 'present'],
  passeCompose: ['present'], plusQueParfait: ['passeAnterieur', 'passeCompose'], passeAnterieur: ['plusQueParfait'],
  futurAnterieur: ['conditionnelPasse'], conditionnelPasse: ['futurAnterieur'],
  subjonctif: ['present', 'imparfait'], subjonctifPasse: ['passeCompose']
};

function stripAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
// Clé approximative de prononciation : deux formes de même clé « sonnent »
// pareil, ce sont les pièges les plus redoutables.
function soundKey(s) {
  var k = stripAccents(s.toLowerCase());
  return k.split(' ').map(function (w) {
    w = w.replace(/ent$/, '').replace(/[sxtd]+$/, '').replace(/(ez|er|ee|e|ai)$/, function (m) { return m === 'e' ? '' : 'E'; });
    return w;
  }).join(' ');
}

// Variantes fabriquées d'une forme simple : fautes d'orthographe typiques.
function morphTraps(v, f, tense) {
  var out = [];
  function push(x) { if (x && x !== f) out.push(x); }
  // Terminaisons muettes échangées.
  var dre = /dre$/.test(v.inf);
  if (/[^eod][sz]?s$/.test(f) && !/(es|ons|ez)$/.test(f)) { push(f.replace(/s$/, 't')); push(f.replace(/s$/, '')); }
  if (/t$/.test(f) && !/ent$/.test(f)) { push(f.replace(/t$/, 's')); if (dre && tense === 'present') push(f.replace(/t$/, 'd')); }
  if (/d$/.test(f)) { push(f.replace(/d$/, 't')); push(f + 's'); }
  if (/e$/.test(f)) push(f + 's');
  if (/es$/.test(f) && !/(mes|tes)$/.test(f)) push(f.replace(/s$/, ''));
  if (/[aiu]$/.test(f)) push(f + 't');
  // Accents oubliés ou mal placés.
  if (/[âîû]/.test(f)) push(f.replace(/[âîû]/, function (c) { return stripAccents(c); }));
  if (/è/.test(f)) { push(f.replace('è', 'e')); push(f.replace('è', 'é')); }
  if (/é/.test(f) && v.family === 'eacute') push(f.replace(/é(?=[^é]*$)/, 'è'));
  // Cédille et e après g.
  if (/ç/.test(f)) push(f.replace('ç', 'c'));
  if (v.family === 'cer' && /c[ei]/.test(f)) push(f.replace(/c(?=[ei])/, 'ç'));
  if (/ge[aoâ]/.test(f)) push(f.replace(/ge(?=[aoâ])/, 'g'));
  if (v.family === 'ger' && /g[i]/.test(f)) push(f.replace(/g(?=i)/, 'ge'));
  // Consonne doublée ou non.
  if (v.family === 'll') { push(f.replace(/(ll|tt)/, function (m) { return m[0]; })); push(f.replace(/e(ll|tt)/, function (m, c) { return 'è' + c[0]; })); }
  if (v.family === 'eGrave') push(f.replace(/è([lt])/, 'e$1$1'));
  if (v.family === 'e' || v.family === 'eGrave') push(f.replace('è', 'e'));
  // y / i.
  if (/oi[e]/.test(f) || /ui[e]/.test(f)) push(f.replace(/([ou])i(?=e)/, '$1y'));
  if (/[ou]y[e]/.test(f)) push(f.replace(/([ou])y(?=e)/, '$1i'));
  if (/ii/.test(f)) push(f.replace('ii', 'i'));
  if (/yi/.test(f)) push(f.replace('yi', 'y'));
  return out;
}

// Formes « régularisées » que les élèves inventent souvent.
function regularTraps(v, tense, p) {
  var out = [], inf = v.inf;
  var futStem = /re$/.test(inf) ? inf.slice(0, -1) : inf;
  if (tense === 'futur') out.push(futStem + END.futur[p]);
  if (tense === 'conditionnel') out.push(futStem + END.conditionnel[p]);
  var imp = forms(v, 'imparfait', 3);
  var impStem = imp ? imp[0].replace(/ions$/, '') : null;
  if (tense === 'passeSimple' && impStem && v.group !== 1) {
    out.push(impStem + END.ps_a[p]);
    var ps = forms(v, 'passeSimple', p)[0];
    out.push(ps.replace(/u(s|t|rent)$/, 'i$1').replace(/ûmes$/, 'îmes').replace(/ûtes$/, 'îtes'));
    out.push(ps.replace(/i(s|t|rent)$/, 'u$1').replace(/îmes$/, 'ûmes').replace(/îtes$/, 'ûtes'));
  }
  if (tense === 'subjonctif' && impStem) out.push(impStem + END.subjonctif[p]);
  return out;
}

/* ---------- Explications ---------- */
// L'explication d'une réponse est une liste de phrases courtes : le groupe du
// verbe, la formation du temps, la terminaison de la personne demandée (s, t,
// x, -ai / -ais…), puis les pièges du radical (accent, consonne double,
// cédille, y / i…) visibles dans la forme attendue.
function first(v, tense, p) { var f = forms(v, tense, p, 'm'); return f ? f[0] : ''; }
function psType(v) {
  var f = v.t.passeSimple[2][0];
  return /int$/.test(f) ? 'in' : /ut$/.test(f) ? 'u' : /it$/.test(f) ? 'i' : 'a';
}
var IRREGULAR_SUBJ = ['être', 'avoir', 'aller', 'faire', 'pouvoir', 'savoir', 'vouloir'];
function quote(s) { return '« ' + s + ' »'; }
function je(form) { return startsWithVowel(form) ? "j'" + form : 'je ' + form; }

function groupNote(v) {
  var nous = first(v, 'present', 3);
  if (v.group === 0) return quote(v.inf) + ' est un auxiliaire : conjugaison irrégulière, à savoir par cœur. Il sert aussi à former les temps composés.';
  if (v.group === 1) return quote(v.inf) + ' est du 1er groupe : infinitif en -er (tous les verbes en -er sauf aller). C\'est le groupe le plus régulier.';
  if (v.group === 2) return quote(v.inf) + ' est du 2e groupe : infinitif en -ir et -iss- au pluriel du présent (nous ' + nous + ').';
  if (v.inf === 'aller') return quote('aller') + ' est du 3e groupe malgré son infinitif en -er : il est irrégulier (je vais, j\'irai, que j\'aille).';
  var why = /oir$/.test(v.inf) ? 'infinitif en -oir' : /ir$/.test(v.inf) ? 'infinitif en -ir, mais sans -iss- : nous ' + nous
    : 'infinitif en -re';
  return quote(v.inf) + ' est du 3e groupe (' + why + ') : son radical peut changer selon le temps et la personne.';
}

function futStem(v) { return first(v, 'futur', 0).replace(/ai$/, ''); }
function tenseNote(v, tense) {
  var nous = first(v, 'present', 3), ils = first(v, 'present', 5);
  switch (tense) {
    case 'present':
      if (v.group === 0 || v.inf === 'aller') return 'Présent irrégulier, à savoir par cœur : ' + table(v, 'present') + '.';
      if (v.group === 1) return 'Présent du 1er groupe : radical + -e, -es, -e, -ons, -ez, -ent.';
      if (v.family === 'ouvrir') return 'Présent : -e, -es, -e, -ons, -ez, -ent, comme les verbes du 1er groupe.';
      if (v.group === 2) return 'Présent du 2e groupe : -is, -is, -it, -issons, -issez, -issent.';
      if (v.family === 'prendre') return 'Présent : -ds, -ds, -d au singulier (le d de l\'infinitif reste : ' + first(v, 'present', 2) + '), puis le radical change au pluriel : nous ' + first(v, 'present', 3) + ', vous ' + first(v, 'present', 4) + ', ils ' + first(v, 'present', 5) + '.';
      if (v.family === 'rendre') return 'Présent des verbes en -dre : -ds, -ds, -d, -dons, -dez, -dent : le d de l\'infinitif reste.';
      if (/x$/.test(first(v, 'present', 0))) return 'Présent : -x, -x, -t, -ons, -ez, -ent (je peux, je veux).';
      return 'Présent du 3e groupe : le plus souvent -s, -s, -t, -ons, -ez, -ent.';
    case 'imperatif':
      return 'Impératif : seulement tu, nous et vous, sans pronom sujet. Les formes sont en général celles du présent.';
    case 'imparfait':
      if (v.inf === 'être') return 'Imparfait : radical ét- (seule exception) + -ais, -ais, -ait, -ions, -iez, -aient.';
      return 'Imparfait : radical de « nous » au présent (nous ' + nous + ') + -ais, -ais, -ait, -ions, -iez, -aient. C\'est vrai pour tous les verbes, sauf être.';
    case 'futur':
    case 'conditionnel':
      var st = futStem(v), how;
      if (st === v.inf) how = 'l\'infinitif entier (' + st + '-)';
      else if (st === v.inf.slice(0, -1)) how = 'l\'infinitif sans son e final (' + st + '-)';
      else if (v.group === 1) how = 'l\'infinitif avec le radical modifié (' + st + '-)';
      else how = 'un radical irrégulier (' + st + '-)';
      if (tense === 'futur') return 'Futur : ' + how + ' + -ai, -as, -a, -ons, -ez, -ont. Le radical du futur se termine toujours par r.';
      return 'Conditionnel présent : le radical du futur, ' + how + ', + les terminaisons de l\'imparfait : -ais, -ais, -ait, -ions, -iez, -aient.';
    case 'passeSimple':
      switch (psType(v)) {
        case 'a': return 'Passé simple en -a (1er groupe et aller) : -ai, -as, -a, -âmes, -âtes, -èrent.';
        case 'i': return 'Passé simple en -i' + (v.group === 2 ? ' (tout le 2e groupe)' : '') + ' : -is, -is, -it, -îmes, -îtes, -irent.';
        case 'u': return 'Passé simple en -u : -us, -us, -ut, -ûmes, -ûtes, -urent.';
        default: return 'Passé simple en -in (venir, tenir et leurs composés) : -ins, -ins, -int, -înmes, -întes, -inrent.';
      }
    case 'subjonctif':
      if (IRREGULAR_SUBJ.indexOf(v.inf) >= 0) return 'Subjonctif irrégulier, à savoir par cœur : ' + table(v, 'subjonctif') + '.';
      var a = ils.replace(/ent$/, ''), b = first(v, 'subjonctif', 3).replace(/ions$/, '');
      return 'Subjonctif présent : que + radical de « ils » au présent (ils ' + ils + ') + -e, -es, -e, -ions, -iez, -ent.' +
        (a !== b ? ' Avec nous et vous, le radical est celui de l\'imparfait : que nous ' + first(v, 'subjonctif', 3) + '.' : '');
  }
  return '';
}

// Terminaison de la personne demandée : pourquoi un s, un t, un x, ou rien.
function endingNote(v, tense, p, f, pron) {
  var f0 = first(v, tense, 0), f1 = first(v, tense, 1), presNous = first(v, 'present', 3);
  function doubleI() {
    if (/ii(ons|ez)$/.test(f)) return ' Le radical se termine déjà par i (nous ' + presNous + ') : on écrit donc deux i.';
    if (/yi(ons|ez)$/.test(f)) return ' Le y du radical est suivi du i de la terminaison : on l\'entend à peine, mais il s\'écrit.';
    return '';
  }
  switch (tense) {
    case 'present':
      if (p === 0) {
        if (/e$/.test(f)) return 'Avec je, terminaison -e, sans s : c\'est le cas de tous les verbes en -er (et de ouvrir, offrir, cueillir). Le s n\'arrive qu\'avec tu : tu ' + f1 + '.';
        if (/x$/.test(f)) return 'Avec je, terminaison -x, comme avec tu : je peux, je veux.';
        if (/s$/.test(f)) return 'Avec je, terminaison -s, comme avec tu : aux 2e et 3e groupes, je finis, je prends. Jamais de t avec je.';
        return 'Forme irrégulière : ' + je(f) + '.';
      }
      if (p === 1) return /x$/.test(f) ? 'Avec tu, terminaison -x (tu peux, tu veux) : c\'est le seul cas où tu ne finit pas par -s.'
        : 'Avec tu, la forme finit toujours par -s (ou -x pour peux, veux), à tous les temps, sauf à l\'impératif.';
      if (p === 2) {
        if (/e$/.test(f)) return 'Avec il / elle, terminaison -e, ni t ni s : c\'est la même forme qu\'avec je (je ' + f0 + ', ' + pron + ' ' + f + ').';
        if (/d$/.test(f)) return 'Avec il / elle, les verbes en -dre gardent le d de l\'infinitif et ne prennent pas de t : ' + pron + ' ' + f + '.';
        if (/t$/.test(f)) return 'Avec il / elle, terminaison -t (le s est pour je et tu) : ' + pron + ' ' + f + '.';
        return 'Forme irrégulière, sans t ni s : ' + pron + ' ' + f + '.';
      }
      if (p === 3) return /ons$/.test(f) ? 'Avec nous, toujours -ons au présent.' : 'Exception : nous sommes (et non « nous êtons »).';
      if (p === 4) return /ez$/.test(f) ? 'Avec vous, -ez.' : 'Exception : seuls être, dire et faire ne font pas -ez (vous êtes, vous dites, vous faites).';
      return /ont$/.test(f) ? 'Exception en -ont, qui se prononce : ils ont, ils sont, ils font, ils vont.'
        : 'Avec ils / elles, terminaison -ent, qui ne se prononce pas : ' + pron + ' ' + f + '.';
    case 'imperatif':
      if (p === 1) return /[sx]$/.test(f)
        ? 'À l\'impératif, les verbes en -ir, -oir et -re gardent le s du présent : ' + f + ' !'
        : 'À l\'impératif, pas de s avec tu quand la forme finit par -e ou -a (verbes en -er, ouvrir, cueillir, et va, aie, sache, veuille) : ' + f + ' ! Le s ne revient que devant en et y : vas-y, manges-en.';
      if (/(yons|yez|ons|ez)$/.test(f) && f === first(v, 'present', p)) return 'Même forme qu\'au présent, sans le pronom : ' + f + ' !';
      return 'Forme irrégulière, empruntée au subjonctif (sans i) : ' + f + ' !';
    case 'imparfait':
    case 'conditionnel':
      var other = tense === 'imparfait' ? 'le passé simple ou le futur' : 'le futur';
      if (p === 0) return 'Avec je, -ais, avec un s : ' + je(f) + '. Sans s (-ai), ce serait ' + other + '.' +
        (tense === 'conditionnel' ? ' Astuce : passer à nous → nous ' + first(v, 'conditionnel', 3) + ' (conditionnel), et non nous ' + first(v, 'futur', 3) + ' (futur).' : '');
      if (p === 1) return 'Avec tu, -ais : tu ' + f + '.';
      if (p === 2) return 'Avec il / elle, -ait, avec un t : ' + pron + ' ' + f + '.';
      if (p === 3) return 'Avec nous, -ions : nous ' + f + '.' + doubleI();
      if (p === 4) return 'Avec vous, -iez : vous ' + f + '.' + doubleI();
      return 'Avec ils / elles, -aient : ' + pron + ' ' + f + ' ; rien ne se prononce après « ai ».';
    case 'futur':
      if (p === 0) return 'Avec je, -ai, sans s : ' + je(f) + '. Avec un s (-ais), ce serait le conditionnel. Astuce : passer à nous → nous ' + first(v, 'futur', 3) + ' (futur), et non nous ' + first(v, 'conditionnel', 3) + ' (conditionnel).';
      if (p === 1) return 'Avec tu, -as : tu ' + f + '.';
      if (p === 2) return 'Avec il / elle, -a, sans t : ' + pron + ' ' + f + '.';
      if (p === 3) return 'Avec nous, -ons : nous ' + f + '.';
      if (p === 4) return 'Avec vous, -ez : vous ' + f + '.';
      return 'Avec ils / elles, -ont, qui se prononce « on » : ' + pron + ' ' + f + '.';
    case 'passeSimple':
      var t = psType(v);
      if (t === 'a') {
        if (p === 0) return 'Avec je, -ai, sans s : ' + je(f) + '. Avec un s, ' + je(first(v, 'imparfait', 0)) + ', c\'est l\'imparfait.';
        if (p === 1) return 'Avec tu, -as : tu ' + f + '.';
        if (p === 2) return 'Avec il / elle, -a, sans t : ' + pron + ' ' + f + '.';
        if (p === 3) return 'Avec nous, -âmes, avec un accent circonflexe sur le a : nous ' + f + '.';
        if (p === 4) return 'Avec vous, -âtes, avec un accent circonflexe sur le a : vous ' + f + '.';
        return 'Avec ils / elles, -èrent, avec un accent grave : ' + pron + ' ' + f + '.';
      }
      var vow = t === 'in' ? 'in' : t, hat = { i: 'î', u: 'û', 'in': 'în' }[t];
      if (p < 2) return 'Avec ' + (p ? 'tu' : 'je') + ', -' + vow + 's, avec un s : ' + (p ? 'tu ' + f : je(f)) + '.';
      if (p === 2) return 'Avec il / elle, -' + vow + 't, avec un t : ' + pron + ' ' + f + '.';
      if (p === 3) return 'Avec nous, -' + hat + 'mes, avec un accent circonflexe : nous ' + f + '.';
      if (p === 4) return 'Avec vous, -' + hat + 'tes, avec un accent circonflexe : vous ' + f + '.';
      return 'Avec ils / elles, -' + vow + 'rent : ' + pron + ' ' + f + '.';
    case 'subjonctif':
      if (p === 0) return /e$/.test(f) ? 'Avec je, -e, sans s : que ' + je(f) + '.' : 'Exception : que je sois, avec un s.';
      if (p === 1) return 'Avec tu, -s comme toujours : que tu ' + f + '.';
      if (p === 2) return /e$/.test(f) ? 'Avec il / elle, -e, sans t : qu\'' + pron + ' ' + f + '.' : 'Exceptions : qu\'il ait, qu\'il soit, avec un t.';
      if (p === 3) return /yons$/.test(f) ? 'Que nous ayons, que nous soyons : pas de i après le y.'
        : 'Avec nous, -ions, comme à l\'imparfait : que nous ' + f + '.' + doubleI();
      if (p === 4) return /yez$/.test(f) ? 'Que vous ayez, que vous soyez : pas de i après le y.'
        : 'Avec vous, -iez, comme à l\'imparfait : que vous ' + f + '.' + doubleI();
      return 'Avec ils / elles, -ent, muet : qu\'' + pron + ' ' + f + '.';
  }
  return '';
}

// Temps composés : auxiliaire, terminaison et accord du participe passé.
function compoundNotes(v, tense, p, pron, f) {
  var pf = ppForms(v), pp = pf[0], aux = f.split(' ')[0], out = [];
  var auxTense = TENSES[COMPOUND[tense]].name.toLowerCase();
  out.push('Temps composé : auxiliaire ' + v.aux + (/^[aeiou]/.test(auxTense) ? ' à l\'' : ' au ') + auxTense + ' (' + aux + ') + participe passé de ' + quote(v.inf) + '.');
  if (v.inf === 'être' || v.inf === 'avoir') out.push('Participe passé irrégulier : ' + pp + '.');
  else if (pp === 'dû') out.push('Dû prend un accent circonflexe au masculin singulier, pour ne pas le confondre avec l\'article « du » ; mais due, dus, dues.');
  else if (/é$/.test(pp)) out.push('Participe passé en -é pour tous les verbes en -er : ' + pp + ', jamais -er, -ez ou -ait. Astuce : remplacer par « vendu » ; si ça marche, c\'est -é.');
  else if (/s$/.test(pp)) out.push('Participe en -s : on l\'entend au féminin (' + pf[1] + '), donc il y a un s au masculin : ' + pp + '.');
  else if (/t$/.test(pp)) out.push('Participe en -t : on l\'entend au féminin (' + pf[1] + '), donc il y a un t au masculin : ' + pp + '.');
  else out.push('Participe en -' + pp.slice(-1) + ', sans s ni t : au féminin on dit ' + pf[1] + ', on n\'entend aucune consonne finale.');
  if (v.aux === 'être') out.push('Avec être, le participe s\'accorde avec le sujet (' + pron + ') : ' + f.split(' ').slice(1).join(' ') + '. Exemple : elles sont ' + pf[3] + '.');
  else out.push('Avec avoir, le participe ne s\'accorde pas avec le sujet : elles ont ' + pp + '.');
  return out;
}

// Piège de l'autre auxiliaire. Avec être, un verbe qui a un complément d'objet
// direct (tenir, prendre…) forme une vraie phrase, mais à la voix passive :
// « tu étais tenu » existe, ce n'est pas le plus-que-parfait de tenir. Pour
// les autres verbes, la forme avec l'autre auxiliaire n'existe pas.
var NO_PASSIVE = ['être', 'avoir', 'dormir', 'rire', 'nager', 'courir', 'pouvoir', 'devoir', 'vouloir', 'répondre'];
function sayWith(pron, form, tense) {
  var t = (pron === 'je' && startsWithVowel(form)) ? "j'" + form : pron + ' ' + form;
  if (tense === 'subjonctifPasse') t = (/^[aeiouy]/.test(t) ? "qu'" : 'que ') + t;
  return t;
}
function deQuote(inf) { return (/^[aeéèêiouyh]/.test(inf) ? 'd\'' : 'de ') + quote(inf); }
// Renvoie la forme piège (sans pronom) et la phrase qui l'explique.
function otherAuxNote(v, tense, p, pron) {
  var auxTense = COMPOUND[tense], aname = TENSES[auxTense].name.toLowerCase(), pf = ppForms(v);
  var other = v.aux === 'être' ? 'avoir' : 'être', form = auxVerb(other).t[auxTense][p][0] + ' ' + pf[0];
  var said = '« ' + sayWith(pron, form, tense) + ' »';
  if (v.aux === 'être' || NO_PASSIVE.indexOf(v.inf) >= 0)
    return { form: form, text: 'Piège : ' + said + ' n\'existe pas : ' + quote(v.inf) + ' se conjugue avec ' + v.aux + ' aux temps composés.' };
  // Voix passive : le participe s'accorde avec le sujet.
  var agreed = auxVerb('être').t[auxTense][p][0] + ' ' + pf[(p >= 3 ? 2 : 0) + (/elle/.test(pron) ? 1 : 0)];
  return { form: form, text: 'Piège : ' + said + (agreed === form ? ' existe' : ' ressemble à une vraie phrase') +
    ', mais c\'est la voix passive, où le sujet subit l\'action (' + sayWith(pron, agreed, tense) + ' par quelqu\'un), avec être ' +
    (/^[aeiou]/.test(aname) ? 'à l\'' : 'au ') + aname + '. Le ' + TENSES[tense].name.toLowerCase() + ' ' + deQuote(v.inf) + ' se forme avec avoir.' };
}

// Pièges du radical visibles dans la forme attendue.
function stemNotes(v, tense, p, f, correct) {
  var out = [], nous = first(v, 'present', 3), je0 = first(v, 'present', 0), fam = v.family;
  if (/ç/.test(f)) out.push('Cédille : ç devant a, o ou u, pour garder le son « s » (' + f + ').');
  else if ((fam === 'cer' || fam === 'recevoir') && /c[ei]/.test(f)) out.push('Pas de cédille devant e ou i : le c s\'y prononce déjà « s » (' + f + ').');
  if (fam === 'ger') out.push(/ge[aoâ]/.test(f) ? 'Un e après le g devant a ou o, pour garder le son « j » (' + f + ').'
    : 'Pas de e ajouté après le g devant e ou i : le g s\'y prononce déjà « j » (' + f + ').');
  if (fam === 'e' || fam === 'eGrave') {
    if (/è/.test(f)) out.push('Le e du radical devient è devant une syllabe muette : ' + f + ' (mais nous ' + nous + ', où la syllabe suivante se prononce).' +
      (fam === 'eGrave' ? ' ' + quote(v.inf) + ' prend l\'accent grave au lieu de doubler la consonne : pas de « ' + f.replace(/è([lt])/, 'e$1$1') + ' ».' : ''));
    else out.push('Pas d\'accent ici : la syllabe suivante se prononce (' + f + '). L\'accent grave n\'apparaît que devant une syllabe muette (' + je(je0) + ').');
  }
  if (fam === 'eacute') {
    if (/è/.test(f)) out.push('Le é devient è devant une terminaison muette : ' + f + '.');
    else out.push('Le é reste é quand la terminaison se prononce : ' + f + ' (mais ' + je(je0) + ').');
    if (correct.length > 1) out.push('Au futur et au conditionnel, les deux accents sont admis : ' + correct.join(' / ') + '.');
  }
  if (fam === 'll') {
    if (/(ll|tt)/.test(f)) out.push(quote(v.inf) + ' double sa consonne devant une syllabe muette : ' + f + ' (mais nous ' + nous + ').');
    else out.push('Une seule consonne ici : la syllabe suivante se prononce (' + f + '). On ne double que devant un e muet (' + je(je0) + ').');
  }
  if (fam === 'oyer' || fam === 'uyer' || fam === 'envoyer' || fam === 'ayer') {
    if (/[oua]i(e|r)/.test(f)) out.push('Le y devient i devant un e muet : ' + f + ' (mais nous ' + nous + ').');
    else if (/y/.test(f) && !/yi/.test(f)) out.push('Le y reste : la terminaison se prononce (' + f + ').');
    if (fam === 'ayer' && correct.length > 1) out.push('Verbes en -ayer : deux orthographes admises devant un e muet : ' + correct.join(' / ') + '.');
  }
  if (fam === 'ier' && (tense === 'futur' || tense === 'conditionnel')) out.push('Le e de l\'infinitif reste au futur et au conditionnel, même s\'il ne s\'entend pas : ' + f + '.');
  if ((tense === 'futur' || tense === 'conditionnel') && /rr/.test(f))
    out.push('Deux r : ' + (fam === 'courir' || fam === 'mourir' ? 'le r du radical (' + v.inf.slice(0, -2) + '-) + le r du futur' : 'radical irrégulier en -rr-') + ' : ' + f + '.');
  if (/nn/.test(f) && (fam === 'prendre' || fam === 'venir')) out.push('Deux n devant une terminaison muette : ' + f + ' (mais nous ' + nous + ').');
  if (fam === 'mettre' && tense !== 'passeSimple') out.push(/tt/.test(f) ? 'Deux t, comme dans l\'infinitif : ' + f + '.' : 'Un seul t au singulier du présent : je mets, il met.');
  if (fam === 'indre') out.push(/gn/.test(f) ? 'Devant une voyelle, -gn- : ' + f + '.' : /[st]$/.test(f) && tense === 'present' ? 'Pas de d : les verbes en -indre le perdent au présent (je peins, il peint).' : '');
  if (fam === 'résoudre' && tense === 'present' && p < 3) out.push('Pas de d : je résous, il résout.');
  if (fam === 'partir' && tense === 'present' && p < 3) out.push('La consonne finale du radical tombe au singulier : ' + je(je0) + ' (mais nous ' + nous + ').');
  if (/î/.test(f) && fam === 'connaître') out.push('î devant le t (il connaît, je connaîtrai) ; connait, sans accent, est aussi admis (orthographe rectifiée).');
  return out.filter(Boolean);
}

function explainConj(v, tense, p, pron, correct, accepted, options) {
  var f = correct[0], lines = [groupNote(v)];
  if (COMPOUND[tense]) {
    lines = lines.concat(compoundNotes(v, tense, p, pron, f));
    // Le piège de l'autre auxiliaire n'est expliqué que s'il est proposé.
    var trap = otherAuxNote(v, tense, p, pron);
    if (options && options.indexOf(trap.form) >= 0) lines.push(trap.text);
  }
  else {
    lines.push(tenseNote(v, tense));
    lines.push(endingNote(v, tense, p, f, pron));
    lines = lines.concat(stemNotes(v, tense, p, f, correct));
  }
  if (correct.length > 1 && !/^(eacute|ayer)$/.test(v.family)) lines.push('Les deux orthographes sont acceptées : ' + correct.join(' / ') + '.');
  if (accepted.length > correct.length) lines.push('Le sujet peut être masculin ou féminin : ' + accepted.join(' ou ') + ' sont justes.');
  if ((v.group === 3 || v.group === 0) && FAMILY_NOTES[v.family]) lines.push('À retenir : ' + FAMILY_NOTES[v.family]);
  return lines.filter(Boolean);
}

function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

// Construit une question : verbe v, temps, personne p (0 à 5).
// Renvoie { prompt, options, ok, explain } ; explain est une liste de phrases.
function makeQuestion(v, tense, p, rnd) {
  rnd = rnd || Math.random;
  var compound = !!COMPOUND[tense];
  var third = p === 2 || p === 5;
  var gender = third && rnd() < 0.5 ? 'f' : 'm';
  var pron = PRON_TXT[p];
  if (third && gender === 'f') pron = p === 2 ? 'elle' : 'elles';
  var sub = tense === 'subjonctif' || tense === 'subjonctifPasse';
  function say(form) {
    if (tense === 'imperatif') return form;
    var t = (pron === 'je' && startsWithVowel(form)) ? "j'" + form : pron + ' ' + form;
    if (sub) t = (/^[aeiouy]/.test(t) ? "qu'" : 'que ') + t;
    return t;
  }
  var correct = forms(v, tense, p, gender);
  // Accord avec être à je, tu, nous, vous : le genre n'est pas précisé, les
  // deux accords sont justes.
  var accepted = correct.slice();
  if (compound && v.aux === 'être' && !third) accepted = accepted.concat(forms(v, tense, p, 'f'));

  var cands = []; // { f, w }
  function add(f, w) { if (f && accepted.indexOf(f) < 0) cands.push({ f: f, w: w }); }
  var key = soundKey(correct[0]);

  if (compound) {
    var auxV = auxVerb(v.aux), otherAux = auxVerb(v.aux === 'être' ? 'avoir' : 'être');
    var auxForm = auxV.t[COMPOUND[tense]][p][0];
    var pf = ppForms(v), pp = correct[0].split(' ').slice(1).join(' ');
    var otherAuxForm = otherAux.t[COMPOUND[tense]][p][0];
    add(otherAuxForm + ' ' + (v.aux === 'être' ? pf[0] : pp), 3);
    var ppTraps = [];
    if (v.group === 1 || v.inf === 'aller') { var b = v.inf.slice(0, -2); ppTraps.push(v.inf, b + 'ez', b + 'ait'); }
    if (/s$/.test(pf[0])) ppTraps.push(pf[0].replace(/s$/, 't'), pf[0].replace(/s$/, ''));
    else if (/t$/.test(pf[0])) ppTraps.push(pf[0].replace(/t$/, 's'), pf[0].replace(/t$/, ''));
    else if (/[iu]$/.test(pf[0])) ppTraps.push(pf[0] + 't', pf[0] + 's');
    else if (/û$/.test(pf[0])) ppTraps.push('du', 'dû' + 's');
    if (v.aux === 'être') pf.forEach(function (x) { if (third) ppTraps.push(x); });
    else ppTraps.push(pf[1], pf[2]);
    ppTraps.forEach(function (x) { if (x !== pp) add(auxForm + ' ' + x, 3); });
    (CONFUSE[tense] || []).forEach(function (t2) { var f2 = forms(v, t2, p, gender); if (f2) add(f2[0], 2); });
    // Auxiliaire à une autre personne (ils ont / il a).
    for (var q = 0; q < 6; q++) if (q !== p) { var fq = forms(v, tense, q, gender); if (fq) add(fq[0], 1); }
  } else {
    for (var q2 = 0; q2 < 6; q2++) if (q2 !== p) {
      var fo = forms(v, tense, q2, gender);
      if (fo) fo.forEach(function (x) { add(x, soundKey(x) === key ? 4 : 1); });
    }
    (CONFUSE[tense] || []).forEach(function (t2) {
      var f2 = forms(v, t2, p, gender);
      if (f2) f2.forEach(function (x) { add(x, soundKey(x) === key ? 4 : 2); });
    });
    correct.forEach(function (c) { morphTraps(v, c, tense).forEach(function (x) { add(x, soundKey(x) === key ? 4 : 2); }); });
    regularTraps(v, tense, p).forEach(function (x) { add(x, 3); });
  }

  // Trois pièges : les mieux notés, au hasard à égalité.
  var seen = {};
  cands = cands.filter(function (c) { if (seen[c.f]) return false; seen[c.f] = 1; return true; });
  cands.forEach(function (c) { c.r = c.w + rnd() * 0.9; });
  cands.sort(function (a, b) { return b.r - a.r; });
  var traps = cands.slice(0, 3).map(function (c) { return c.f; });

  // Les réponses sont les seules formes verbales ; le sujet est dans l'énoncé.
  var options = [correct[0]].concat(traps);
  var subject;
  if (tense === 'imperatif') subject = '(' + pron + ')';
  else {
    subject = pron;
    if (pron === 'je' && options.some(startsWithVowel)) subject = "je / j'";
    if (sub) subject = (/^[aeiouy]/.test(pron) ? "qu'" : 'que ') + subject;
  }
  var explain = explainConj(v, tense, p, pron, correct, accepted, options);
  return {
    prompt: subject + ' ___ (verbe : ' + v.inf + ')',
    options: options,
    ok: [0],
    explain: explain,
    correctText: say(correct[0])
  };
}

var api = { PERSONS: PERSONS, TENSES: TENSES, TENSE_ORDER: TENSE_ORDER, COMPOUND: COMPOUND, VERBS: VERBS,
  forms: forms, ppForms: ppForms, table: table, withPronoun: withPronoun, END: END, firstGroup: firstGroup,
  makeQuestion: makeQuestion, explain: explainConj, soundKey: soundKey, FAMILY_NOTES: FAMILY_NOTES };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CONJ = api;
})(this);
