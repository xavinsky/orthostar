/* Générateur des questions de grammaire.
   Chaque règle fabrique une question à partir d'un vocabulaire tiré au hasard :
   les statistiques du joueur portent sur la règle, pas sur la phrase, et la
   même phrase revient rarement. Les formes verbales viennent de conjugaison.js. */
(function (root) {
'use strict';

/* ---------- Outils ---------- */
function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function verb(inf) { return CONJ.VERBS.filter(function (v) { return v.inf === inf; })[0]; }
function conj(inf, tense, p) { return CONJ.forms(verb(inf), tense, p, 'm')[0]; }
function vowel(s) { return /^[aeéèêiîouyh]/i.test(s); }
// Une question : bonne réponse en premier, puis les pièges (sans doublon).
function Q(q, good, traps, e) {
  var o = uniq([good].concat(traps.filter(function (t) { return t !== good; })));
  return { q: q, o: o.slice(0, 4), ok: [0], e: e };
}
// Formes d'un adjectif ou d'un participe : [m. sg., f. sg., m. pl., f. pl.].
function adj(ms, fs, mp, fp) {
  fs = fs || ms + 'e';
  mp = mp || (/[sx]$/.test(ms) ? ms : ms + 's');
  fp = fp || fs + 's';
  return [ms, fs, mp, fp];
}
function formIndex(g, pl) { return (pl ? 2 : 0) + (g === 'f' ? 1 : 0); }

/* ---------- Vocabulaire ---------- */
var NAMES = [['Léa', 'f'], ['Inès', 'f'], ['Chloé', 'f'], ['Emma', 'f'], ['ma sœur', 'f'], ['la voisine', 'f'],
  ['Hugo', 'm'], ['Tom', 'm'], ['Lucas', 'm'], ['Nathan', 'm'], ['mon frère', 'm'], ['le voisin', 'm']];
var GROUPS = [['les filles', 'f'], ['mes cousines', 'f'], ['les joueuses', 'f'], ['ses amies', 'f'],
  ['les garçons', 'm'], ['mes cousins', 'm'], ['les joueurs', 'm'], ['ses amis', 'm']];
// Noms : [singulier, pluriel, genre].
var NOUNS = [['chat', 'chats', 'm'], ['chien', 'chiens', 'm'], ['vélo', 'vélos', 'm'], ['livre', 'livres', 'm'],
  ['jardin', 'jardins', 'm'], ['manteau', 'manteaux', 'm'], ['ballon', 'ballons', 'm'], ['sac', 'sacs', 'm'],
  ['maison', 'maisons', 'f'], ['voiture', 'voitures', 'f'], ['robe', 'robes', 'f'], ['fleur', 'fleurs', 'f'],
  ['chemise', 'chemises', 'f'], ['porte', 'portes', 'f'], ['valise', 'valises', 'f'], ['lampe', 'lampes', 'f']];
// Adjectifs dont le masculin et le féminin s'écrivent différemment.
var ADJS = [adj('petit'), adj('grand'), adj('noir'), adj('joli'), adj('vert'), adj('gris', 'grise'), adj('lourd'),
  adj('neuf', 'neuve'), adj('long', 'longue'), adj('blanc', 'blanche'), adj('ancien', 'ancienne'), adj('léger', 'légère')];
// Adjectifs pour des personnes.
var PADJS = [adj('fatigué'), adj('content'), adj('prêt'), adj('inquiet', 'inquiète'), adj('fier', 'fière'),
  adj('heureux', 'heureuse', 'heureux'), adj('surpris', 'surprise'), adj('malade', 'malade')];
// Verbes avec un complément qui convient à tous les sujets.
var VPHR = [['chanter', 'dans la chorale'], ['manger', 'à la cantine'], ['dormir', 'sous la tente'], ['courir', 'dans le parc'],
  ['lire', 'à la bibliothèque'], ['écrire', 'au tableau'], ['attendre', 'devant l\'école'], ['répondre', 'au téléphone'],
  ['partir', 'en vacances'], ['finir', 'avant midi'], ['prendre', 'le bus'], ['venir', 'à la fête'], ['nager', 'dans la piscine'],
  ['crier', 'dans la cour'], ['dire', 'la vérité'], ['faire', 'du vélo'], ['voir', 'la mer'], ['boire', 'de l\'eau'], ['rire', 'aux éclats']];
// Verbes du 1er groupe et un complément.
var ER = [['chanter', 'une chanson'], ['ranger', 'la chambre'], ['regarder', 'un film'], ['écouter', 'la radio'],
  ['préparer', 'le repas'], ['laver', 'la voiture'], ['porter', 'un sac'], ['dessiner', 'un cheval'], ['gagner', 'le match'],
  ['réparer', 'le vélo'], ['chercher', 'la clé'], ['terminer', 'le travail']];
var PERS_SUBJ = [[2, 'il'], [2, 'elle'], [5, 'ils'], [5, 'elles']];
function subjectSing(rnd) { var n = pick(NAMES, rnd); return { txt: n[0], g: n[1], p: 2 }; }
function subjectPlur(rnd) { var n = pick(GROUPS, rnd); return { txt: n[0], g: n[1], p: 5 }; }
function subject(rnd) { return rnd() < 0.5 ? subjectSing(rnd) : subjectPlur(rnd); }

// Pièges d'accord sujet-verbe : formes du même temps aux autres personnes,
// en priorité celles qui se prononcent pareil.
function verbTraps(inf, tense, p) {
  var good = conj(inf, tense, p), key = CONJ.soundKey(good), all = [];
  for (var q = 0; q < 6; q++) if (q !== p) all.push(conj(inf, tense, q));
  all = uniq(all).filter(function (f) { return f !== good; });
  all.sort(function (a, b) { return (CONJ.soundKey(b) === key) - (CONJ.soundKey(a) === key); });
  return all;
}

/* ---------- Règles ---------- */
var RULES = [];
function rule(id, level, name, anchor, explain, gen) {
  RULES.push({ id: id, level: level, name: name, r: anchor, explain: explain, gen: gen });
}

/* Niveau 1 */
rule('a', 1, 'a / à', 'homophones', 'Si l\'on peut dire « avait », c\'est le verbe avoir : a. Sinon, c\'est la préposition à.', function (rnd) {
  var s = subjectSing(rnd);
  var t = pick([
    function () { return [cap(s.txt) + ' ___ ' + pick(['un vélo rouge', 'une idée', 'un chat noir', 'beaucoup d\'amis', 'faim'], rnd) + '.', 'a']; },
    function () { return [cap(s.txt) + ' va ___ ' + pick(['la plage', 'la piscine', 'Paris', 'la boulangerie', 'Marseille'], rnd) + '.', 'à']; },
    function () { return [cap(s.txt) + ' ___ peur ' + pick(['du noir', 'des orages', 'des araignées'], rnd) + '.', 'a']; },
    function () { return ['C\'est une machine ___ ' + pick(['laver', 'coudre', 'écrire'], rnd) + '.', 'à']; },
    function () { return [cap(s.txt) + ' pense ___ ' + pick(['ses vacances', 'son examen', 'sa grand-mère'], rnd) + '.', 'à']; }
  ], rnd)();
  return Q(t[0], t[1], ['a', 'à', 'as'].filter(function (x) { return x !== t[1]; }).slice(0, t[1] === 'a' ? 1 : 2));
});
rule('et', 1, 'et / est', 'homophones', 'Si l\'on peut dire « était », c\'est le verbe être : est. Si l\'on peut dire « et puis », c\'est et.', function (rnd) {
  var s = subjectSing(rnd), a = pick(PADJS, rnd), n2 = pick(NAMES, rnd)[0];
  var t = pick([
    function () { return [cap(s.txt) + ' ___ ' + a[formIndex(s.g, false)] + '.', 'est']; },
    function () { return [cap(s.txt) + ' ___ ' + n2 + ' partent ensemble.', 'et']; },
    function () { return [cap(s.txt) + ' mange une pomme ___ une poire.', 'et']; },
    function () { return ['Le ciel ___ ' + pick(['gris', 'bleu', 'nuageux'], rnd) + ' ce matin.', 'est']; }
  ], rnd)();
  return Q(t[0], t[1], ['et', 'est', 'es', 'ait']);
});
rule('on', 1, 'on / ont', 'homophones', 'Si l\'on peut dire « avaient », c\'est le verbe avoir : ont. Si l\'on peut dire « il », c\'est on.', function (rnd) {
  var g = subjectPlur(rnd);
  var t = pick([
    function () { return ['___ dit qu\'il va ' + pick(['pleuvoir', 'neiger', 'faire beau'], rnd) + '.', 'On']; },
    function () { return [cap(g.txt) + ' ___ ' + pick(['gagné le match', 'fini leurs devoirs', 'raté le bus', 'vu un film'], rnd) + '.', 'ont']; },
    function () { return ['Demain, ___ ' + pick(['ira au cinéma', 'partira tôt', 'mangera dehors'], rnd) + '.', 'on']; }
  ], rnd)();
  return Q(t[0], t[1], t[1] === 'On' ? ['Ont'] : t[1] === 'on' ? ['ont'] : ['on']);
});
rule('son', 1, 'son / sont', 'homophones', 'Si l\'on peut dire « étaient », c\'est le verbe être : sont. Si l\'on peut dire « mon », c\'est son.', function (rnd) {
  var g = subjectPlur(rnd), a = pick(PADJS, rnd), s = subjectSing(rnd);
  var n = pick(NOUNS.filter(function (x) { return x[2] === 'm'; }), rnd);
  var t = pick([
    function () { return [cap(g.txt) + ' ___ ' + a[formIndex(g.g, true)] + '.', 'sont']; },
    function () { return [cap(s.txt) + ' a perdu ___ ' + n[0] + '.', 'son']; },
    function () { return ['Où ___ ' + pick(['mes clés', 'tes chaussures', 'les enfants'], rnd) + ' ?', 'sont']; }
  ], rnd)();
  return Q(t[0], t[1], ['son', 'sont', 'sons']);
});
rule('ou', 1, 'ou / où', 'homophones', 'Où (avec accent) indique le lieu ou le moment. Si l\'on peut dire « ou bien », c\'est ou.', function (rnd) {
  var t = pick([
    function () { return ['___ as-tu mis ' + pick(['mon livre', 'les clés', 'ton manteau'], rnd) + ' ?', 'Où']; },
    function () { return ['Tu préfères ' + pick(['le thé ___ le café', 'la mer ___ la montagne', 'le bus ___ le train', 'lire ___ jouer'], rnd) + ' ?', 'ou']; },
    function () { return ['La ville ___ ' + pick(['j\'habite', 'il est né', 'nous allons'], rnd) + ' est très belle.', 'où']; }
  ], rnd)();
  return Q(t[0], t[1], t[1] === 'Où' ? ['Ou'] : t[1] === 'ou' ? ['où'] : ['ou']);
});
rule('sujetVerbe', 1, 'Accord du sujet et du verbe', 'accords', 'Le verbe s\'accorde avec son sujet : on cherche « qui est-ce qui ? » devant le verbe.', function (rnd) {
  var s = subject(rnd), vp = pick(VPHR, rnd), tense = pick(['present', 'imparfait', 'futur'], rnd);
  var good = conj(vp[0], tense, s.p);
  return Q(cap(s.txt) + ' ___ ' + vp[1] + '. (' + vp[0] + ', ' + CONJ.TENSES[tense].name.toLowerCase() + ')', good, verbTraps(vp[0], tense, s.p));
});
rule('nomAdj', 1, 'Accord du nom et de l\'adjectif', 'gn', 'L\'adjectif s\'accorde en genre et en nombre avec le nom qu\'il qualifie.', function (rnd) {
  var n = pick(NOUNS, rnd), a = pick(ADJS, rnd), pl = rnd() < 0.6;
  var det = pl ? 'des' : (n[2] === 'f' ? 'une' : 'un');
  var good = a[formIndex(n[2], pl)];
  return Q('J\'ai vu ' + det + ' ' + (pl ? n[1] : n[0]) + ' ___ .', good, a);
});
rule('eEr', 1, '-é / -er / -ez / -ait', 'e-er', 'On remplace par vendre ou vendu : vendre → -er (infinitif), vendu → -é (participe passé), vendez → -ez, vendait → -ait.', function (rnd) {
  var v = pick(ER, rnd), b = v[0].slice(0, -2), s = subjectSing(rnd);
  var forms = { er: v[0], e: b + 'é', ez: b + 'ez', ait: b + 'ait' };
  var t = pick([
    [cap(s.txt) + ' va ___ ' + v[1] + '.', 'er'], [cap(s.txt) + ' veut ___ ' + v[1] + '.', 'er'],
    [cap(s.txt) + ' a ___ ' + v[1] + '.', 'e'], ['Pour ___ ' + v[1] + ', il faut du temps.', 'er'],
    ['Vous ___ ' + v[1] + ' ?', 'ez'], ['Hier, ' + s.txt + ' ___ ' + v[1] + ' quand je suis arrivé.', 'ait']
  ], rnd);
  return Q(t[0], forms[t[1]], [forms.er, forms.e, forms.ez, forms.ait]);
});

/* Niveau 2 */
rule('ce', 2, 'ce / se', 'homophones', 'Devant un verbe, si l\'on peut dire « me » (je me lève), c\'est se. Devant un nom, c\'est le déterminant ce.', function (rnd) {
  var s = subjectSing(rnd), n = pick(NOUNS.filter(function (x) { return x[2] === 'm' && !vowel(x[0]); }), rnd);
  var t = pick([
    [cap(s.txt) + ' ___ ' + pick(['lève', 'lave', 'cache', 'promène', 'réveille', 'coiffe'], rnd) + ' ' + pick(['tôt', 'vite', 'dans le jardin'], rnd) + '.', 'se'],
    ['___ ' + n[0] + ' est à moi.', 'Ce'], ['Regarde ___ ' + n[0] + ' !', 'ce']
  ], rnd);
  return Q(t[0], t[1], t[1] === 'Ce' ? ['Se', 'Ceux'] : t[1] === 'ce' ? ['se', 'ceux'] : ['ce', 'ceux']);
});
rule('ces', 2, 'ces / ses / c\'est / s\'est', 'homophones', 'ces : ceux-là ; ses : les siens ; c\'est : cela est ; s\'est : devant un participe (il s\'est levé, on peut dire « je me suis levé »).', function (rnd) {
  var s = subjectSing(rnd), n = pick(NOUNS, rnd);
  var t = pick([
    [cap(s.txt) + ' a rangé ___ ' + pick(['affaires', 'livres', 'jouets', 'vêtements'], rnd) + '.', 'ses'],
    ['Regarde ___ ' + n[1] + '-là !', 'ces'],
    ['___ ' + (n[2] === 'f' ? 'une belle ' : 'un beau ') + n[0] + '.', 'C\'est'],
    [cap(s.txt) + ' ___ ' + pick([['levé', 'levée'], ['blessé', 'blessée'], ['caché', 'cachée'], ['trompé', 'trompée']], rnd)[s.g === 'f' ? 1 : 0] + ' ce matin.', 's\'est']
  ], rnd);
  var all = t[1] === 'C\'est' ? ['C\'est', 'S\'est', 'Ces', 'Ses'] : ['ces', 'ses', 'c\'est', 's\'est'];
  return Q(t[0], t[1], all);
});
rule('la', 2, 'la / là / l\'a', 'homophones', 'là (accent) : on peut dire « ici ». l\'a : on peut dire « l\'avait ». la : déterminant ou pronom (on peut dire « le »).', function (rnd) {
  var s = subjectSing(rnd), f = pick(NOUNS.filter(function (x) { return x[2] === 'f'; }), rnd);
  var t = pick([
    ['Pose ' + pick(['ton sac', 'la valise', 'ce carton'], rnd) + ' ___ .', 'là'],
    ['Sa ' + pick(['sœur', 'cousine', 'voisine'], rnd) + ', ' + s.txt + ' ___ vue hier.', 'l\'a'],
    [cap(s.txt) + ' regarde ___ ' + f[0] + '.', 'la']
  ], rnd);
  return Q(t[0], t[1], ['la', 'là', 'l\'a', 'l\'as']);
});
rule('leur', 2, 'leur / leurs', 'homophones', 'Devant un verbe, leur est un pronom : il ne prend jamais de s. Devant un nom pluriel, le déterminant leurs s\'accorde.', function (rnd) {
  var g = subjectPlur(rnd), n = pick(NOUNS, rnd);
  var t = pick([
    ['Je ___ ' + pick(['parle souvent', 'donne un conseil', 'écris une lettre', 'téléphone ce soir'], rnd) + '.', 'leur'],
    [cap(g.txt) + ' rangent ___ ' + n[1] + '.', 'leurs'],
    [cap(g.txt) + ' aiment ___ ' + (n[2] === 'm' ? 'nouveau ' : 'nouvelle ') + n[0] + '.', 'leur']
  ], rnd);
  return Q(t[0], t[1], ['leur', 'leurs']);
});
rule('sujetLoin', 2, 'Sujet éloigné du verbe', 'accords', 'Le verbe s\'accorde avec le sujet, même s\'il est éloigné : dans « les amis de mon frère », le sujet est « les amis ».', function (rnd) {
  var heads = [['Les amis', 5], ['Les cousines', 5], ['Le chien', 2], ['La voisine', 2], ['Les élèves', 5], ['Le professeur', 2]];
  var h = pick(heads, rnd);
  var comp = h[1] === 5 ? pick(['de mon frère', 'de la classe', 'de ma tante'], rnd) : pick(['de mes voisins', 'de nos cousins', 'des enfants'], rnd);
  var vp = pick(VPHR, rnd), tense = pick(['present', 'imparfait'], rnd);
  return Q(h[0] + ' ' + comp + ' ___ ' + vp[1] + '. (' + vp[0] + ', ' + CONJ.TENSES[tense].name.toLowerCase() + ')',
    conj(vp[0], tense, h[1]), verbTraps(vp[0], tense, h[1]));
});
var ETRE = [['partir', adj('parti'), 'tôt'], ['arriver', adj('arrivé'), 'en retard'], ['venir', adj('venu'), 'à la fête'],
  ['tomber', adj('tombé'), 'dans l\'escalier'], ['rester', adj('resté'), 'à la maison'], ['sortir', adj('sorti'), 'dans le jardin'],
  ['rentrer', adj('rentré'), 'tard'], ['descendre', adj('descendu'), 'à la cave'], ['monter', adj('monté'), 'au grenier'], ['aller', adj('allé'), 'au cinéma']];
rule('ppEtre', 2, 'Participe passé avec être', 'pp', 'Avec l\'auxiliaire être, le participe passé s\'accorde avec le sujet.', function (rnd) {
  var s = subject(rnd), v = pick(ETRE, rnd), pl = s.p === 5, imp = rnd() < 0.4;
  var aux = imp ? (pl ? 'étaient' : 'était') : (pl ? 'sont' : 'est');
  return Q(cap(s.txt) + ' ' + aux + ' ___ ' + v[2] + '.', v[1][formIndex(s.g, pl)], v[1]);
});
var AVOIR = [['chanter', adj('chanté'), 'une chanson'], ['manger', adj('mangé'), 'une pomme'], ['prendre', adj('pris', 'prise'), 'le train'],
  ['écrire', adj('écrit'), 'une lettre'], ['lire', adj('lu'), 'un roman'], ['faire', adj('fait'), 'un gâteau'], ['ouvrir', adj('ouvert'), 'la porte'],
  ['peindre', adj('peint'), 'un tableau'], ['choisir', adj('choisi'), 'un livre'], ['attendre', adj('attendu'), 'le bus'], ['cueillir', adj('cueilli'), 'des fleurs']];
rule('ppAvoir', 2, 'Participe passé avec avoir', 'pp', 'Avec l\'auxiliaire avoir, le participe passé ne s\'accorde jamais avec le sujet.', function (rnd) {
  var s = rnd() < 0.7 ? subjectPlur(rnd) : subjectSing(rnd), v = pick(AVOIR, rnd), pl = s.p === 5;
  var traps = v[1].slice(1);
  if (/er$/.test(v[0])) traps.push(v[0]);
  return Q(cap(s.txt) + ' ' + (pl ? 'ont' : 'a') + ' ___ ' + v[2] + '.', v[1][0], traps);
});
var PLURALS = [['cheval', 'chevaux', ['chevals', 'chevaus']], ['journal', 'journaux', ['journals', 'journeaux']], ['animal', 'animaux', ['animals', 'animeaux']],
  ['bijou', 'bijoux', ['bijous', 'bijou']], ['caillou', 'cailloux', ['caillous', 'caillou']], ['genou', 'genoux', ['genous', 'genou']],
  ['hibou', 'hiboux', ['hibous', 'hibou']], ['trou', 'trous', ['troux', 'trou']], ['clou', 'clous', ['cloux', 'clou']],
  ['bateau', 'bateaux', ['bateaus', 'bateau']], ['cadeau', 'cadeaux', ['cadeaus', 'cadeau']], ['jeu', 'jeux', ['jeus', 'jeu']],
  ['cheveu', 'cheveux', ['cheveus', 'cheveu']], ['pneu', 'pneus', ['pneux', 'pneu']], ['travail', 'travaux', ['travails', 'travaus']],
  ['festival', 'festivals', ['festivaux', 'festivales']], ['bal', 'bals', ['baux', 'bales']], ['détail', 'détails', ['détaux', 'détail']],
  ['œil', 'yeux', ['œils', 'œuils']], ['tuyau', 'tuyaux', ['tuyaus', 'tuyau']]];
rule('pluriels', 2, 'Pluriels particuliers', 'pluriels', 'Noms en -al → -aux (sauf bal, carnaval, festival…) ; -ou → -ous, sauf bijou, caillou, chou, genou, hibou, joujou, pou ; -eau, -au, -eu → -x (sauf pneu, bleu) ; -ail → -ails, sauf travail, vitrail… → -aux.', function (rnd) {
  var x = pick(PLURALS, rnd);
  return Q('Un ' + x[0] + ', des ___ .', x[1], x[2]);
});

/* Niveau 3 */
rule('quel', 3, 'quel / quelle / qu\'elle', 'homophones', 'quel s\'accorde avec le nom (quel, quelle, quels, quelles). Si l\'on peut dire « qu\'il », c\'est qu\'elle.', function (rnd) {
  var t = pick([
    ['___ belle journée !', 'Quelle'], ['___ beaux jardins !', 'Quels'], ['___ chance tu as !', 'Quelle'],
    ['___ livre préfères-tu ?', 'Quel'], ['___ couleurs aimes-tu ?', 'Quelles'],
    ['Je crois ___ ' + conj(pick(['venir', 'partir', 'répondre', 'finir'], rnd), 'futur', 2) + ' demain.', 'qu\'elle'],
    ['Il faut ___ ' + pick(['vienne', 'parte', 'réponde', 'finisse'], rnd) + ' tôt.', 'qu\'elle']
  ], rnd);
  var all = /^[A-Z]/.test(t[1]) ? ['Quel', 'Quelle', 'Quels', 'Quelles', 'Qu\'elle'] : ['quel', 'quelle', 'quels', 'qu\'elle'];
  return Q(t[0], t[1], shuffle(all, rnd));
});
rule('peu', 3, 'peu / peut / peux', 'homophones', 'peut / peux : verbe pouvoir (on peut dire « pouvait ») ; il peut, je peux, tu peux. peu : petite quantité (« un peu »).', function (rnd) {
  var s = subjectSing(rnd);
  var t = pick([
    [cap(s.txt) + ' ___ ' + pick(['venir demain', 'nager seul', 'lire ce livre'], rnd) + '.', 'peut'],
    ['Je ___ ' + pick(['t\'aider', 'venir', 'le porter'], rnd) + '.', 'peux'], ['Tu ___ ' + pick(['entrer', 'jouer', 'partir'], rnd) + '.', 'peux'],
    [cap(s.txt) + ' mange un ___ .', 'peu'], ['Il reste ' + pick(['un ___ de pain', 'un ___ de lait', 'trop ___ de temps'], rnd) + '.', 'peu']
  ], rnd);
  return Q(t[0], t[1], ['peu', 'peut', 'peux']);
});
rule('quand', 3, 'quand / quant / qu\'en', 'homophones', 'quand : moment (on peut dire « lorsque »). quant à : en ce qui concerne. qu\'en : que + en (qu\'en penses-tu ?).', function (rnd) {
  var t = pick([
    ['___ il ' + pick(['arrivera', 'viendra', 'partira'], rnd) + ', appelle-moi.', 'Quand'],
    ['Je viendrai ___ j\'aurai fini.', 'quand'],
    ['___ à ' + pick(['moi', 'lui', 'Léa', 'mon frère'], rnd) + ', ' + pick(['je reste ici', 'il préfère attendre', 'elle a déjà mangé'], rnd) + '.', 'Quant'],
    ['___ ' + pick(['penses-tu', 'dis-tu', 'sais-tu'], rnd) + ' ?', 'Qu\'en']
  ], rnd);
  var all = /^[A-Z]/.test(t[1]) ? ['Quand', 'Quant', 'Qu\'en'] : ['quand', 'quant', 'qu\'en'];
  return Q(t[0], t[1], all);
});
rule('sans', 3, 'sans / s\'en', 'homophones', 'sans : préposition, contraire de « avec ». s\'en : devant un verbe (on peut dire « je m\'en vais »).', function (rnd) {
  var s = subjectSing(rnd);
  var t = pick([
    [cap(s.txt) + ' est ' + (s.g === 'f' ? 'partie' : 'parti') + ' ___ ' + pick(['dire au revoir', 'faire de bruit', 'son manteau', 'attendre'], rnd) + '.', 'sans'],
    [cap(s.txt) + ' ___ ' + pick(['va', 'souvient', 'moque', 'occupe'], rnd) + '.', 's\'en'],
    ['Il boit son café ___ sucre.', 'sans']
  ], rnd);
  return Q(t[0], t[1], ['sans', 's\'en', 'c\'en', 'sang']);
});
var QUI = [['moi', 0, 'C\'est'], ['toi', 1, 'C\'est'], ['lui', 2, 'C\'est'], ['elle', 2, 'C\'est'], ['nous', 3, 'C\'est'], ['vous', 4, 'C\'est'], ['eux', 5, 'Ce sont']];
rule('qui', 3, 'Accord après « qui »', 'accords', 'Le pronom relatif qui prend la personne et le nombre du mot qu\'il remplace : c\'est moi qui suis, c\'est toi qui as.', function (rnd) {
  var x = pick(QUI, rnd), vp = pick(VPHR, rnd), tense = pick(['present', 'imparfait'], rnd);
  return Q(x[2] + ' ' + x[0] + ' qui ___ ' + vp[1] + '. (' + vp[0] + ', ' + CONJ.TENSES[tense].name.toLowerCase() + ')',
    conj(vp[0], tense, x[1]), verbTraps(vp[0], tense, x[1]));
});
var OBJ = [['lire', 'Ces livres'], ['manger', 'Ces pommes'], ['acheter', 'Ces gâteaux'], ['appeler', 'Tes amis'], ['jeter', 'Ces papiers'],
  ['nettoyer', 'Ces vitres'], ['ouvrir', 'Ces fenêtres'], ['cueillir', 'Ces fleurs'], ['peindre', 'Ces murs'], ['attendre', 'Tes cousins'],
  ['choisir', 'Ces couleurs'], ['rendre', 'Ces livres'], ['voir', 'Ces étoiles'], ['écrire', 'Ces lettres'], ['finir', 'Ces exercices']];
rule('pronomCod', 3, 'Pronom complément devant le verbe', 'accords', 'Dans « je les regarde », les n\'est pas le sujet : le verbe s\'accorde avec le sujet je.', function (rnd) {
  var o = pick(OBJ, rnd), ps = pick([[0, 'je'], [1, 'tu'], [2, 'il'], [2, 'elle'], [3, 'nous'], [4, 'vous']], rnd), tense = pick(['present', 'imparfait'], rnd);
  var good = conj(o[0], tense, ps[0]);
  var traps = [conj(o[0], tense, 5)].concat(verbTraps(o[0], tense, ps[0]));
  return Q(o[1] + ', ' + ps[1] + ' les ___ chaque ' + pick(['jour', 'semaine', 'matin'], rnd) + '. (' + o[0] + ', ' + CONJ.TENSES[tense].name.toLowerCase() + ')', good, traps);
});
var COLORS = [[adj('vert'), true], [adj('noir'), true], [adj('bleu'), true], [adj('gris', 'grise'), true], [adj('blanc', 'blanche'), true],
  [adj('rose', 'rose'), true], [adj('mauve', 'mauve'), true], [['orange', 'orange', 'orange', 'orange'], false],
  [['marron', 'marron', 'marron', 'marron'], false], [['bleu clair', 'bleu clair', 'bleu clair', 'bleu clair'], false],
  [['vert foncé', 'vert foncé', 'vert foncé', 'vert foncé'], false]];
rule('couleurs', 3, 'Adjectifs de couleur', 'gn', 'Une couleur simple s\'accorde (des robes vertes), sauf si elle vient d\'un nom (orange, marron) ou si elle est composée (bleu clair) ; rose et mauve s\'accordent.', function (rnd) {
  var c = pick(COLORS, rnd), n = pick(NOUNS, rnd), good = c[0][formIndex(n[2], true)];
  var traps = c[1] ? c[0] : [good + 's', good.replace(' ', 's ') + (/ /.test(good) ? '' : 'e'), good.replace(/ (\S+)$/, 's $1s')];
  if (c[0][0] === 'bleu clair') traps = ['bleus clairs', 'bleues claires', 'bleu claires'];
  if (c[0][0] === 'vert foncé') traps = ['verts foncés', 'vertes foncées', 'vert foncées'];
  if (c[0][0] === 'orange') traps = ['oranges', 'orangés'];
  if (c[0][0] === 'marron') traps = ['marrons', 'marronnes'];
  return Q('Des ' + n[1] + ' ___ .', good, traps);
});
rule('toutDet', 3, 'tout / tous / toute / toutes', 'gn', 'Devant un nom (avec son déterminant), tout s\'accorde : tout le jour, toute la nuit, tous les jours, toutes les nuits.', function (rnd) {
  var n = pick(NOUNS, rnd), pl = rnd() < 0.6;
  var good = pl ? (n[2] === 'f' ? 'toutes' : 'tous') : (n[2] === 'f' ? 'toute' : 'tout');
  var det = pl ? 'les' : (n[2] === 'f' ? 'la' : 'le');
  return Q('J\'ai regardé ___ ' + det + ' ' + (pl ? n[1] : n[0]) + '.', good, ['tout', 'tous', 'toute', 'toutes', 'touts']);
});

/* Niveau 4 */
var COD = [['écrire', 'lettres', 'f', adj('écrit')], ['cueillir', 'fleurs', 'f', adj('cueilli')], ['manger', 'pommes', 'f', adj('mangé')],
  ['lire', 'livres', 'm', adj('lu')], ['faire', 'gâteaux', 'm', adj('fait')], ['prendre', 'photos', 'f', adj('pris', 'prise')],
  ['chanter', 'chansons', 'f', adj('chanté')], ['choisir', 'robes', 'f', adj('choisi')], ['offrir', 'cadeaux', 'm', adj('offert')],
  ['peindre', 'murs', 'm', adj('peint')], ['ouvrir', 'portes', 'f', adj('ouvert')], ['recevoir', 'cartes', 'f', adj('reçu')]];
rule('ppCod', 4, 'Participe passé avec avoir : COD placé avant', 'pp', 'Avec avoir, le participe passé s\'accorde avec le complément d\'objet direct quand il est placé avant le verbe (que, les, la…).', function (rnd) {
  var c = pick(COD, rnd), s = subject(rnd), aux = s.p === 5 ? 'ont' : 'a';
  var t = pick([
    ['Les ' + c[1] + ' que ' + s.txt + ' ' + aux + ' ___ sont ' + (c[2] === 'f' ? 'belles' : 'beaux') + '.', true],
    ['Ces ' + c[1] + ', je les ai ___ hier.', true],
    [cap(s.txt) + ' ' + aux + ' ___ des ' + c[1] + '.', false]
  ], rnd);
  return Q(t[0], t[1] ? c[3][formIndex(c[2], true)] : c[3][0], c[3]);
});
var PRONO = [[adj('levé'), 'tôt'], [adj('réveillé'), 'en retard'], [adj('couché'), 'tard'], [adj('caché'), 'derrière l\'arbre'],
  [adj('habillé'), 'en vitesse'], [adj('promené'), 'au bord de la mer']];
var PRONO_COD = [['lavé', 'les mains'], ['brossé', 'les dents'], ['coupé', 'les cheveux'], ['lavé', 'le visage']];
rule('ppPrDouble', 4, 'Participe passé des verbes pronominaux', 'pp', 'Elles se sont levées : se est le complément d\'objet, le participe s\'accorde avec le sujet. Elles se sont lavé les mains : le complément d\'objet (les mains) est placé après, pas d\'accord.', function (rnd) {
  var s = subject(rnd), pl = s.p === 5, aux = pl ? 'se sont' : 's\'est';
  if (rnd() < 0.55) {
    var v = pick(PRONO, rnd);
    return Q(cap(s.txt) + ' ' + aux + ' ___ ' + v[1] + '.', v[0][formIndex(s.g, pl)], v[0]);
  }
  var w = pick(PRONO_COD, rnd), f = adj(w[0]);
  return Q(cap(s.txt) + ' ' + aux + ' ___ ' + w[1] + '.', f[0], f.slice(1));
});
var NUMBERS = [['quatre-vingts', ['quatre-vingt', 'quatres-vingts']], ['quatre-vingt-trois', ['quatre-vingts-trois', 'quatres-vingt-trois']],
  ['deux cents', ['deux cent', 'deux cens']], ['trois cent douze', ['trois cents douze', 'trois cent douzes']],
  ['cinq cents', ['cinq cent', 'cinq cens']], ['six cent vingt', ['six cents vingt', 'six cent vingts']],
  ['deux mille', ['deux milles', 'deux mils']], ['trois mille cinq cents', ['trois milles cinq cents', 'trois mille cinq cent']],
  ['quatre-vingt-dix', ['quatre-vingts-dix', 'quatres-vingt-dix']], ['huit cents', ['huit cent', 'huit cens']],
  ['neuf cent un', ['neuf cents un', 'neuf cent uns']], ['mille deux cents', ['milles deux cents', 'mille deux cent']]];
rule('nombres', 4, 'vingt / cent / mille', 'gn', 'Vingt et cent prennent un s quand ils sont multipliés et ne sont pas suivis d\'un autre nombre (quatre-vingts, deux cents, mais deux cent dix). Mille est invariable.', function (rnd) {
  var x = pick(NUMBERS, rnd);
  return Q('Il y a ___ ' + pick(['personnes dans la salle', 'pages dans ce livre', 'kilomètres jusqu\'à la mer', 'élèves dans le collège'], rnd) + '.', x[0], x[1]);
});
var TOUT_ADJ = [['petits', 'm', true, 'tout'], ['contents', 'm', true, 'tout'], ['petite', 'f', false, 'toute'], ['contente', 'f', false, 'toute'],
  ['seule', 'f', false, 'toute'], ['fière', 'f', false, 'toute'], ['heureuse', 'f', false, 'tout'], ['émue', 'f', false, 'tout'],
  ['étonnée', 'f', false, 'tout'], ['inquiète', 'f', false, 'tout'], ['petites', 'f', true, 'toutes'], ['seules', 'f', true, 'toutes'],
  ['heureuses', 'f', true, 'tout'], ['émues', 'f', true, 'tout'], ['seuls', 'm', true, 'tout']];
rule('toutAdj', 4, 'tout devant un adjectif', 'gn', 'Devant un adjectif, tout (= entièrement) est invariable, sauf devant un adjectif féminin qui commence par une consonne ou un h aspiré : ils sont tout petits, elle est toute petite, elle est tout heureuse.', function (rnd) {
  var x = pick(TOUT_ADJ, rnd);
  var subj = x[2] ? (x[1] === 'f' ? 'Elles sont' : 'Ils sont') : (x[1] === 'f' ? 'Elle est' : 'Il est');
  return Q(subj + ' ___ ' + x[0] + '.', x[3], ['tout', 'toute', 'tous', 'toutes']);
});
rule('meme', 4, 'même / mêmes', 'gn', 'même s\'accorde quand il signifie « identique » ou suit un pronom (les mêmes, eux-mêmes) ; il est invariable quand il signifie « aussi » (même les enfants riaient).', function (rnd) {
  var n = pick(NOUNS, rnd);
  var t = pick([
    ['Ils ont les ___ ' + n[1] + '.', 'mêmes'], ['Elle a le ___ ' + (n[2] === 'm' ? n[0] : 'sac') + ' que moi.', 'même'],
    ['___ les ' + pick(['enfants riaient', 'parents dansaient', 'professeurs applaudissaient'], rnd) + '.', 'Même'],
    ['Ils l\'ont fait ' + pick(['eux', 'elles'], rnd) + '-___ .', 'mêmes'], ['Nous l\'avons réparé nous-___ .', 'mêmes'],
    ['Il l\'a dit lui-___ .', 'même']
  ], rnd);
  return Q(t[0], t[1], t[1] === 'Même' ? ['Mêmes', 'Mème'] : ['même', 'mêmes', 'mème']);
});
rule('adjPlusieurs', 4, 'Adjectif qui qualifie plusieurs noms', 'gn', 'Un adjectif qui qualifie plusieurs noms se met au pluriel, et au masculin si l\'un des noms est masculin.', function (rnd) {
  var a = pick(ADJS, rnd);
  var t = pick([
    ['Un ' + pick(['manteau', 'pantalon', 'chapeau'], rnd) + ' et une ' + pick(['robe', 'chemise', 'veste'], rnd) + ' ___ .', 2],
    ['Une ' + pick(['robe', 'chemise', 'veste'], rnd) + ' et une ' + pick(['jupe', 'écharpe', 'casquette'], rnd) + ' ___ .', 3],
    ['Un ' + pick(['vélo', 'ballon', 'sac'], rnd) + ' et un ' + pick(['livre', 'cahier', 'stylo'], rnd) + ' ___ .', 2]
  ], rnd);
  return Q(t[0], a[t[1]], a);
});
var MULTI = [['Toi et moi', 3], ['Mon frère et moi', 3], ['Léa et moi', 3], ['Toi et Léa', 4], ['Toi et ton frère', 4], ['Hugo et Léa', 5], ['Mes parents et ma sœur', 5]];
rule('sujetsMulti', 4, 'Sujets de personnes différentes', 'accords', 'Plusieurs sujets : toi et moi = nous ; toi et lui = vous ; lui et elle = ils.', function (rnd) {
  var m = pick(MULTI, rnd), vp = pick(VPHR, rnd), tense = pick(['present', 'imparfait', 'futur'], rnd);
  return Q(m[0] + ' ___ ' + vp[1] + '. (' + vp[0] + ', ' + CONJ.TENSES[tense].name.toLowerCase() + ')', conj(vp[0], tense, m[1]), verbTraps(vp[0], tense, m[1]));
});
var PP_SEUL = [[adj('fermé'), 'fermer'], [adj('cassé'), 'casser'], [adj('oublié'), 'oublier'], [adj('abandonné'), 'abandonner'],
  [adj('perdu'), 'perdre'], [adj('ouvert'), 'ouvrir'], [adj('peint'), 'peindre'], [adj('écrit'), 'écrire']];
rule('ppSeul', 4, 'Participe passé employé seul', 'pp', 'Employé sans auxiliaire, le participe passé s\'accorde comme un adjectif avec le nom auquel il se rapporte.', function (rnd) {
  var p = pick(PP_SEUL, rnd), n = pick(NOUNS, rnd), pl = rnd() < 0.6;
  var det = pl ? 'des' : (n[2] === 'f' ? 'une' : 'un');
  var traps = p[0].slice();
  if (/er$/.test(p[1])) traps.push(p[1]);
  return Q('J\'ai trouvé ' + det + ' ' + (pl ? n[1] : n[0]) + ' ___ . (' + p[1] + ')', p[0][formIndex(n[2], pl)], traps);
});

function make(r, rnd) {
  rnd = rnd || Math.random;
  var q = r.gen(rnd);
  q.e = r.explain;
  q.r = r.r;
  return q;
}

var api = { RULES: RULES, make: make };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GRAM = api;
})(this);
