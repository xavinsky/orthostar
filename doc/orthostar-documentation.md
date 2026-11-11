# OrthoStar — Documentation fonctionnelle

Jeu de révision de l'orthographe française (lexique, conjugaison, grammaire) pour préparer la dictée du brevet. C'est une application web autonome : `index.html` et ses fichiers voisins, sans serveur. En ligne : https://tekio.org/orthostar/ (dépôt `xavinsky/orthostar`). Le jeu reprend le système de points, de risque/récompense et de progression par joueur de VerbStar, un jeu de révision des verbes irréguliers anglais. Après chaque réponse, les explications renvoient aux règles du site `../prepa-dictee-brevet/` : page Conjugaison (`conjugaison.html`, à l'ancre du temps demandé ; `#temps-composes` pour un temps composé) et page Grammaire pour le reste.

---

## 1. Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page du jeu : barre de navigation, onglets « Jouer », « Profil » (avec son sous-onglet « Classement ») et « Règles du jeu ». |
| `jeux.js` | Fonctionnement du jeu : écrans, tirage, points, records, étoiles, profil, classement. |
| `conjugaison.js` | Moteur de conjugaison : tables des verbes, fabrication des questions et des pièges. |
| `lexique.tsv` | **Liste de référence du lexique**, à modifier dans un tableur ou un éditeur de texte (section 11). |
| `lexique-data.js` | Lexique chargé par le jeu, produit à partir de `lexique.tsv` par `outils/lexique_vers_js.py`. Ne pas modifier à la main. |
| `grammaire.js` | Règles de grammaire et fabrication des questions (section 12). |
| `style.css` | Style de la page : celui du site Prépa dictée, plus les éléments propres au jeu. |

---

## 2. Contenu pédagogique

### 2a. Rubriques

| Rubrique | Contenu | Type de question |
|---|---|---|
| **Lexique** | 2 009 mots : 59 écrits à la main (dont les pluriels particuliers et les mots à deux orthographes admises) et 1 950 mots tirés de Lexique 3.83, dont plus de 800 avec des fautes réellement commises relevées dans WiCoPaCo (section 10). Pièges : consonnes doubles, h, graphies savantes (ph, th, rh, ch, y), sons à plusieurs écritures ([s], [o], voyelles nasales, [é] / [è]), accents, lettres finales muettes, noms en -té / -tié / -ée, -amment / -emment, trait d'union, apostrophe. | Une définition, plusieurs orthographes : cocher **la ou les** bonnes. Certains mots acceptent deux orthographes (*clé / clef*, *événement / évènement*, *oignon / ognon*, *chariot / charriot*, *paie / paye*, *nénuphar / nénufar*) : il faut cocher les deux. Cocher seulement une partie des bonnes orthographes, sans erreur, est un résultat **neutre** (voir 6a). |
| **Grammaire** | 32 règles, 8 par niveau ; chaque phrase est fabriquée au tirage avec un vocabulaire pris au hasard (section 12). | Une seule bonne réponse. |
| **Conjugaison** | Questions fabriquées au moment du tirage : 69 verbes, 13 temps, 6 personnes (voir section 3). | Une seule bonne réponse. |

Chaque question de lexique et de grammaire comporte une explication et un lien vers la règle correspondante de la page Grammaire du site Prépa dictée.

### 2b. Niveaux de difficulté

Quatre niveaux, de 1 (facile) à 4 (expert), avec un code couleur : 1 vert, 2 bleu, 3 ambre, 4 rouge bordeaux.

| Niveau | Lexique (mots) | Grammaire (règles) | Conjugaison (temps) |
|---|---|---|---|
| 1 · facile | 511 | 8 | présent, impératif présent |
| 2 · moyen | 511 | 8 | imparfait, futur simple, passé composé |
| 3 · difficile | 503 | 8 | passé simple, conditionnel présent, plus-que-parfait |
| 4 · expert | 484 | 8 | passé antérieur, futur antérieur, conditionnel passé, subjonctif présent, subjonctif passé |

En lexique et en grammaire, le niveau mesure la difficulté de la question. En conjugaison, il correspond aux temps : de ceux de l'école primaire aux temps de 4e et de 3e du programme de français du cycle 4 (BO n° 10 du 5 mars 2026).

---

## 3. Conjugaison

### 3a. Verbes

69 verbes, choisis pour couvrir chaque famille de conjugaison :

| Groupe | Familles (verbes) |
|---|---|
| Auxiliaires | être, avoir |
| 1er groupe | régulier (chanter, aimer) · -cer (placer, commencer) · -ger (manger, nager) · e → è (lever, mener) · é → è (céder, espérer) · consonne doublée (appeler, jeter) · è sans doubler (acheter, geler) · -oyer (employer, nettoyer) · -uyer (essuyer) · -ayer (payer) · envoyer · -ier (étudier, crier) |
| aller | aller |
| 2e groupe | finir, choisir, grandir |
| 3e groupe en -ir | venir, tenir · partir, dormir, sentir · courir · mourir · ouvrir, offrir, cueillir |
| 3e groupe en -oir | recevoir, apercevoir · voir · devoir · pouvoir · vouloir · savoir |
| 3e groupe en -re | rendre, répondre, attendre · prendre, apprendre, comprendre · mettre, promettre · peindre, éteindre, craindre, plaindre, joindre · résoudre · suivre · vivre · lire · dire · écrire · croire · boire · connaître · rire · conclure · faire |

### 3b. Moteur de conjugaison

- Les formes sont calculées par famille. Pour le 1er groupe, à partir de règles : cédille, e après g, e → è, é → è, consonne doublée, y → i. Pour les autres verbes, à partir d'une description explicite : présent, radical du passé simple et son type (-a, -i, -u, -in), radical du futur, radicaux du subjonctif, participe passé.
- **Temps composés** : auxiliaire au temps voulu suivi du participe passé. Avec *être* (aller, venir, partir, mourir), le participe s'accorde avec le sujet. Avec je, tu, nous et vous, le genre n'est pas précisé : les deux accords sont comptés justes.
- **Variantes admises** : une forme peut avoir plusieurs orthographes acceptées (*il paie / il paye*, *je céderai / je cèderai*, *il connaît / il connait*, *je peux / je puis*). Une variante admise n'est jamais proposée comme piège.
- **Impératif** : seulement aux 2e personne du singulier, 1re et 2e du pluriel. *Pouvoir* et *devoir* n'ont pas d'impératif dans le jeu.

### 3c. Forme des questions

- **Énoncé** : le sujet, un trou, puis le verbe à l'infinitif, par exemple `il ___ (verbe : prendre)`.
  - Le sujet est je, tu, il ou elle, nous, vous, ils ou elles ; le genre de la 3e personne est tiré au hasard.
  - Au subjonctif, l'énoncé commence par « que » ou « qu' ». À l'impératif, le pronom est entre parenthèses : (tu), (nous), (vous).
  - « je » s'affiche « je / j' » quand une réponse commence par une voyelle.
- **Réponses** : uniquement la forme verbale, une bonne et trois pièges.
- **Étiquettes** au-dessus de l'énoncé : rubrique, niveau, puis le **temps**, en petites capitales sur sa couleur (voir 3f).

### 3d. Enchaînement

- **Les personnes s'enchaînent dans l'ordre** : je, tu, il/elle, nous, vous, ils/elles, puis de nouveau je.
- **Les temps passent à tour de rôle** : tous les temps des niveaux cochés, dans un ordre mélangé, quel que soit le score. Un temps ne revient pas deux fois de suite. Un temps impossible pour la personne en cours est sauté : par exemple l'impératif avec je, il ou ils.
- **Le verbe change à chaque question.** Il est tiré parmi les verbes du temps choisi, avec la pondération décrite en 6b.

### 3e. Pièges

Les candidats sont notés, puis les trois mieux notés sont retenus, au hasard à égalité :

1. **Formes qui se prononcent comme la bonne réponse**, en priorité : *finis / finit / finissent*, *chantai / chantais*, *aurai / aurais*. La proximité de prononciation est estimée par une clé simplifiée qui ignore les accents et les terminaisons muettes.
2. **Confusions de temps** pour la même personne :
   - présent et subjonctif ;
   - imparfait et passé simple ;
   - futur et conditionnel ;
   - plus-que-parfait et passé antérieur ;
   - futur antérieur et conditionnel passé ;
   - impératif et présent.
3. **Fautes typiques de la famille du verbe** : cédille ou e après g oubliés, consonne doublée ou non, accent oublié ou mal orienté, y ou i, s / t / d finaux échangés.
4. **Formes régularisées** : futur construit sur l'infinitif (*je voirai*), passé simple sur le modèle du 1er groupe ou avec la mauvaise voyelle (*il prena*, *il courit*), subjonctif construit sur le radical de l'imparfait (*qu'il faise*).
5. **Temps composés** :
   - mauvais auxiliaire (*il a parti*, *il est pris*) ;
   - participe mal écrit (*il a prit*, *a chanter*, *a chantez*, *a chantait*) ;
   - mauvais accord (*elles sont parti*, *ils ont prises*).

Un piège n'est jamais une orthographe acceptée pour la question posée.

### 3f. Couleurs des temps

- **La teinte suit la place du temps sur la ligne du temps**, dans l'ordre de l'arc-en-ciel : passé vers le violet, présent vert, futur vers l'orange.
- **La clarté suit le niveau** : très clair au niveau 1, foncé au niveau 4. Le texte de l'étiquette est foncé aux niveaux 1 et 2, blanc aux niveaux 3 et 4.

| Niveau | Temps · couleur |
|---|---|
| 1 | présent · vert ; impératif présent · vert-jaune |
| 2 | imparfait · bleu ; passé composé · cyan ; futur simple · orange |
| 3 | plus-que-parfait · violet ; passé simple · indigo ; conditionnel présent · jaune doré |
| 4 | passé antérieur · violet profond ; subjonctif passé · bleu nuit ; subjonctif présent · vert sapin ; conditionnel passé · brun doré ; futur antérieur · orange brûlé |

### 3g. Après la réponse

Que la réponse soit juste ou fausse, le jeu affiche :
- **l'explication**, une liste de phrases courtes fabriquée par `conjugaison.js` (`explainConj`) à partir de la forme attendue :
  - le **groupe du verbe** et ce qui le définit (infinitif en -er ; -ir avec -iss- ; tous les autres pour le 3e groupe, aller compris) ;
  - la **formation du temps** : radical utilisé (radical de « nous » pour l'imparfait, de « ils » pour le subjonctif, radical du futur…) et série des terminaisons ;
  - la **terminaison de la personne demandée** : pourquoi un s, un t, un x, un d ou rien (je chante sans s mais je finis avec s, il prend avec d, il chantera sans t, je chanterai / je chanterais avec l'astuce de « nous », impératif sans s au 1er groupe, -âmes / -îmes / -ûmes avec accent circonflexe, double i de nous étudiions, exceptions sommes, êtes, dites, faites, ont, sont, font, vont…) ;
  - pour un temps composé : auxiliaire et son temps, terminaison du participe passé (-é, -i, -u, ou consonne qu'on entend au féminin : pris → prise, écrit → écrite ; dû) et règle d'accord avec être ou avoir ;
  - les **pièges du radical** présents dans la forme : cédille, e après g, è ou é selon la syllabe muette, consonne doublée ou non (appeler, jeter, acheter), y ou i, deux r du futur, deux n, -gn- et absence de d des verbes en -indre, î de connaître ;
  - les variantes admises s'il y en a, et les deux accords possibles avec être quand le sujet est je, tu, nous ou vous ;
  - pour les auxiliaires et le 3e groupe, la règle de la famille du verbe (« À retenir »).
  - Les exemples reprennent le sujet de la question (elle, elles).
- **le tableau de conjugaison complet du verbe**, 13 cartes aux couleurs des temps.
  - Chaque temps simple est placé à côté de son temps composé : présent / passé composé, imparfait / plus-que-parfait, passé simple / passé antérieur, futur / futur antérieur, conditionnel présent / passé, subjonctif présent / passé ; l'impératif vient en dernier.
  - La carte du temps demandé a une bordure épaisse de sa couleur, et la ligne de la personne demandée est encadrée.

---

## 4. Écran 1 — Qui joue ?

- **Nom du joueur**, à taper ou à choisir parmi les joueurs déjà connus sur ce navigateur (boutons).
- **Catégorie**, à choisir pour un nouveau joueur ; un joueur connu retrouve la sienne automatiquement :

  | Catégorie | Handicap |
  |---|---|
  | Collégien ou étranger | aucun |
  | Lycéen ou adulte | −1 étoile (voir section 5) |

- Le bouton **Continuer** reste grisé tant qu'aucune catégorie n'est choisie.
- Boutons « Voir mon profil » et « Voir le classement », qui ouvrent les onglets correspondants.

## 5. Écran 2 — Réglages de la partie

On ne change pas de joueur depuis l'onglet Jouer : c'est le bouton « Changer de joueur » de l'onglet **Profil**, qui ramène à l'écran 1 (« Qui joue ? ») dans l'onglet Jouer.

### Exercice conseillé
- En haut de l'écran, un encadré montre l'exercice qui sera joué (étiquettes de rubrique, carrés de niveaux, étoiles visées et facteur), avec le bouton **Commencer** et le bouton **🎲 Tirer un exo**.
- À chaque arrivée sur l'écran, un exercice conseillé est **déjà tiré au sort** ; « Tirer un exo » en tire un autre.
- Le tirage prend une rubrique au hasard parmi Lexique, Conjugaison, Grammaire et Toutes les rubriques, puis une ligne de score au hasard parmi les **prochaines étapes** de cette rubrique :
  - un niveau seul est toujours ouvert ;
  - une paire (1-2, 2-3, 3-4) s'ouvre quand ses deux niveaux ont chacun au moins une étoile ;
  - « Tous les niveaux » s'ouvre quand les quatre niveaux ont chacun au moins une étoile ;
  - chaque ligne ouverte qui n'a pas le maximum d'étoiles est proposée avec une étoile de plus que son meilleur résultat.
- Si la rubrique tirée n'a plus d'étape, une autre est tirée. Si plus aucune ligne n'en a, l'encadré félicite le joueur et l'invite à choisir dans les réglages personnalisés.
- L'encadré s'intitule « 🎲 Exercice conseillé » pour un tirage, « Ta sélection » dès qu'on modifie un réglage à la main.
- Les règles du jeu en donnent un exemple (« Le prochain exercice conseillé »).

### Réglages personnalisés
Sous l'encadré, un bloc **Réglages personnalisés**, replié à l'ouverture, regroupe la rubrique, les niveaux et le facteur de risque décrits ci-dessous.

### Rubriques
- Choix unique parmi quatre cases : Lexique, Conjugaison, Grammaire, ou **Toutes les rubriques**. On ne peut pas en combiner deux. Aucune n'est choisie à l'ouverture.
- Chaque case affiche son nombre de questions, ou « 69 verbes · 13 temps » pour la conjugaison.

### Niveaux de difficulté
- Sélections possibles : **un seul niveau**, **deux niveaux consécutifs** (1-2, 2-3, 3-4) ou **tous les niveaux** (case « Tous les niveaux »). Le niveau 1 est coché à l'ouverture.
- Comportement d'un clic :
  - sur un niveau voisin du niveau coché, la paire se forme ;
  - sur le niveau juste après ou juste avant une paire, la paire glisse (1-2 puis clic sur 3 → 2-3) ;
  - sur un niveau éloigné, seul ce niveau est coché ;
  - sur un niveau d'une paire, l'autre niveau reste seul ;
  - sur le seul niveau coché, plus rien n'est coché ;
  - depuis « Tous les niveaux », un clic sur un niveau ne garde que lui.
- Quand seule la conjugaison est cochée, chaque case de niveau affiche ses temps.

### Facteur de risque
- Une ligne d'état rappelle la sélection (étiquettes de rubriques, carrés de niveaux) et l'une des trois mentions : le meilleur niveau d'étoiles obtenu, « Pas encore de victoire — meilleur score : X pts », ou « Aucune partie jouée avec cette sélection ».
- Les niveaux de risque proposés dépendent de la catégorie :

  | Facteur | Bonne / mauvaise réponse | Questions | Collégien ou étranger | Lycéen ou adulte |
  |---|---|---|---|---|
  | ×10 | +32 / −3 | 40 | ★ | non proposé |
  | ×1 | +10 / −10 | 40 | ★★ | ★ |
  | ×0,5 | +7 / −14 | 80 | ★★★ | ★★ |
  | ×0,3 | +5 / −18 | 160 | ★★★★ | ★★★ |
  | ×0,1 | +3 / −32 | 240 | ★★★★★ | ★★★★ |

- **Calcul des points** : `gain = round(10 × √facteur)`, `perte = round(10 / √facteur)`.
- Les étoiles s'affichent sur le maximum de la catégorie : 5 pour un collégien ou étranger, 4 pour un lycéen ou adulte.
- **Présélection** : le jeu propose le niveau d'étoiles juste au-dessus du meilleur résultat obtenu sur la sélection, ou le premier niveau accessible s'il n'y en a pas. Le joueur peut en choisir un autre.
- Un aperçu affiche les points d'une bonne et d'une mauvaise réponse.

Le bouton **Commencer** (dans l'encadré du haut) reste grisé tant qu'aucune rubrique ou aucun niveau n'est choisi.

---

## 6. Partie

### 6a. Déroulement
- Le score part de 0. **Victoire à 100 points**, **défaite à −30 points**.
- La partie compte 40 questions, multipliées par le multiplicateur du niveau de risque.
- **Affichage**, de haut en bas, pour que la question et les réponses tiennent en haut de l'écran d'un téléphone sans défilement :
  - la carte de la question, avec une bande en haut à la couleur de son niveau, ses réponses, puis après la réponse le bouton **Continuer** et l'explication : si la réponse est juste, **Continuer** vient juste sous « Bien joué », avant l'explication, pour enchaîner sans défiler sur téléphone ; sinon il vient après l'explication ;
  - sous la carte : le score, le bouton **Terminer**, une jauge entre défaite et victoire, la raison du tirage et le nombre de questions restantes ;
  - en conjugaison, après la réponse, le tableau complet du verbe en dernier.
- **Lexique** : on coche une ou plusieurs réponses, puis on valide. **Conjugaison et grammaire** : un clic sur une réponse suffit.
- **Clavier** : les touches 1 à 4 choisissent une réponse, Entrée valide ou passe à la question suivante.
- **Après la réponse** : bonnes et mauvaises réponses en couleur, points gagnés ou perdus, explication, lien « Voir la règle ».
- **Résultat neutre** (lexique) : si le joueur coche une partie seulement des orthographes admises, sans aucune erreur, la réponse ne compte ni comme une réussite ni comme une erreur. Le jeu affiche « Attention : il existait d'autres orthographes possibles », montre les orthographes oubliées en pointillés verts, et le score reste inchangé (±0). Cette réponse n'entre ni dans les statistiques de la question ni dans le taux de réussite. Le bouton **Continuer** est placé au-dessus du tableau de conjugaison.
- Le bouton **Terminer** arrête la partie à tout moment.

### 6b. Tirage des questions
- **Choix du niveau** pour le lexique et la grammaire :
  - sous 21 points, le niveau le plus facile coché ;
  - au-dessus de 79 points, le plus difficile ;
  - entre les deux, rotation régulière du plus facile au plus difficile.
  - En conjugaison, ce palier ne s'applique pas : les temps tournent comme décrit en 3d.
- **Pas de répétition** : une question ne revient pas dans la même partie, sauf si toute la sélection est épuisée. En conjugaison, une question est un couple verbe + temps. En grammaire, une question est une règle : elle peut revenir dans la partie, avec une autre phrase, mais jamais deux fois de suite.
- **Toutes les rubriques** : le jeu tire d'abord une rubrique au hasard, à égalité, parmi celles qui ont des questions possibles, puis une question dans cette rubrique. Sans cela, le lexique, beaucoup plus nombreux, éclipserait la grammaire.
- **Pondération** : parmi les questions possibles, celles que le joueur a ratées récemment ou n'a pas vues depuis longtemps sortent plus souvent.
  - Poids = `1 + 3 × (erreurs parmi les 10 dernières tentatives) + min(30, jours depuis la dernière tentative)`.
  - Une question jamais tentée a le poids 31, multiplié par sa priorité. En lexique, la priorité vaut 2 pour un mot à fautes réelles, 0,5 pour un mot qui n'a que des pièges faibles, 1 sinon. Dès que le joueur a tenté la question, seul son historique compte.

### 6c. Fin de partie
- La partie s'arrête sur une victoire, une défaite, la limite de questions atteinte, ou le bouton « Terminer ».
- **Écran de résultat** :
  - le statut, le score et le pourcentage de réussite ;
  - les étoiles gagnées s'il y en a ;
  - la réussite par niveau ;
  - la liste « À revoir en priorité » : les questions ratées, avec la bonne réponse et le temps pour la conjugaison.
- **Boutons** : **Nouvelle partie**, qui ouvre les réglages ; après un arrêt par « Terminer », **Reprendre où j'en étais** en plus. Le profil et le classement s'ouvrent par le menu.

---

## 7. Records, étoiles, profil, classement

### Lignes de score
- Une **ligne de score** (ou combinaison) correspond à une rubrique (ou toutes) et une sélection de niveaux : 4 × 8 = **32 lignes**. Chacune a ses propres étoiles.
- Le facteur de risque ne crée pas de ligne : il ne fait que fixer les étoiles d'une victoire sur la ligne jouée. Pour gagner plus d'étoiles, on améliore une ligne avec un risque plus élevé, ou on en ouvre une autre en changeant de rubrique ou de niveaux.
- Les règles du jeu (onglet « Règles du jeu », « Comment gagner de nouvelles étoiles ») l'expliquent avec des exemples.
- Les records d'anciennes combinaisons de deux rubriques restent affichés dans le profil et comptent dans le total.
- Le jeu garde le meilleur résultat de chaque ligne :
  - une victoire bat toujours un résultat sans victoire ;
  - entre deux victoires, le facteur le plus petit l'emporte ;
  - sans victoire, le score le plus élevé l'emporte.
- Une victoire ne compte pour les étoiles qu'à partir de 100 points.
- Le record garde le handicap de la catégorie qu'avait le joueur au moment de la partie.

### Étoiles
- Étoiles du niveau de risque : 1★ pour ×10, puis 2★ pour ×1 ou moins, 3★ pour ×0,5 ou moins, 4★ pour ×0,3 ou moins, 5★ pour ×0,1.
- Étoiles gagnées = étoiles du niveau de risque − handicap de la catégorie.

### Profil
- Onglet **Profil** de la barre de navigation, avec le sous-onglet **Classement**. Une fois le joueur choisi, l'onglet porte son nom : « Profil Xavier ». Il s'affiche à côté de l'écran de jeu sans le remplacer : une partie en cours reste intacte et le bouton « Reprendre la partie » y ramène.
- Sans joueur choisi, l'onglet propose d'en choisir un.
- Le nom, la catégorie et le **total d'étoiles**.
- La liste des lignes de score jouées : étiquettes de rubriques, carrés de niveaux, facteur, étoiles ou meilleur score.
- Une ligne **sans étoile** peut être supprimée ; une ligne étoilée est protégée.
- Un bouton réinitialise les statistiques par question, avec confirmation. Les étoiles et les records sont conservés.

### Classement
- Sous-onglet du Profil (lien « Classement » dans la barre de navigation).
- Il n'apparaît qu'à partir de **deux joueurs** sur le navigateur : en dessous, le lien du menu, les sous-onglets et les boutons « Voir le classement » sont masqués, et l'adresse `#classement` ramène au profil.
- Tous les joueurs de ce navigateur, rangés par total d'étoiles, avec leur catégorie. Le joueur en cours est mis en évidence.
- Le classement n'est pas partagé entre ordinateurs ou navigateurs.

---

## 8. Stockage des données

- Toutes les données restent dans le navigateur, en `localStorage`, sous le préfixe `orthostar:`. Rien n'est envoyé à un serveur.

  | Clé | Contenu |
  |---|---|
  | `players_list` | Joueurs connus. |
  | `profile:<nom>` | Catégorie du joueur. |
  | `stats:<nom>` | 10 dernières tentatives par question (juste ou faux, date). |
  | `records:<nom>` | Meilleur résultat par ligne de score. |
  | `leaderboard:<nom>` | Nom, catégorie, total d'étoiles. |

- Si `localStorage` n'est pas disponible, un stockage en mémoire prend le relais : le jeu reste jouable, sans conservation après rechargement.

---

## 9. Habillage

- Style du site Prépa dictée : palette bleue, coins carrés sur les cadres, ombres prononcées, titres en Palatino, texte en Georgia, mise en page compacte, mode sombre.
- **Téléphone** (largeur de 600 px ou moins) :
  - les cases de réglage passent sur deux colonnes, les niveaux de risque sur trois ;
  - les réponses forment une grille de deux, avec de grandes zones à toucher ;
  - le tableau de conjugaison passe sur deux colonnes ;
  - les numéros de touche 1 à 4 sont masqués, sur petit écran comme sur écran tactile.
- Onglets : **Jouer** (le jeu seul), **Profil** et son sous-onglet **Classement**, **Règles du jeu** (toutes les explications). Les écrans de jeu ne contiennent que les textes nécessaires à l'action. Le clavier ne pilote la partie que lorsque l'onglet Jouer est affiché.
- Codes couleur :
  - **rubriques** : bleu canard ;
  - **niveaux** : vert, bleu, ambre, rouge bordeaux ;
  - **catégories de joueur** : bleu ;
  - **temps de conjugaison** : voir 3f.

---

## 10. Fabrication de la liste du lexique

La liste combine deux sources :
- **Lexique 3.83** (New, Pallier et al., [www.lexique.org](http://www.lexique.org)) : une base d'environ 140 000 mots avec leur prononciation et leur fréquence dans des livres et des sous-titres de films. Licence **CC BY-SA 4.0**.
- **WiCoPaCo** (A. Max et G. Wisniewski, [LREC 2010](https://aclanthology.org/L10-1571/)) : les corrections faites dans l'historique de Wikipédia en français (408 816 modifications, dont 72 493 fautes d'orthographe sur des mots qui n'existent pas). Licence **GNU FDL**. Le site d'origine n'est plus public ; les fichiers ont été récupérés le 8 novembre 2026 depuis l'archive Internet (web.archive.org).

`lexique-data.js` est diffusé sous licence CC BY-SA 4.0. Les deux sources sont citées dans l'onglet Règles du jeu et sur la page Sources du site Prépa dictée.

| Élément | Emplacement |
|---|---|
| Base téléchargée | `donnees/lexique383/` (`Lexique383.tsv`, manuel, licence) |
| Corpus de fautes | `donnees/wicopaco/` (`spelling_error-v3.xml`, `wrhc-fr_070101-sch1-v2.xml.gz`, page d'accueil archivée avec la licence) |
| Statistiques de fautes | `outils/wicopaco_stats.py` → `donnees/wicopaco_stats.tsv` |
| Clé de prononciation | `outils/phonetique.py` |
| Sélection et pièges | `outils/lexique_pieges.py` → `donnees/lexique_candidats.tsv` |
| Définitions | `donnees/definitions_1.json` à `definitions_6.json` |
| Propositions de nouveaux mots | `outils/lexique_construire.py` → `donnees/lexique_propositions.tsv` |

**Fautes réelles** (`wicopaco_stats.py`, `phonetique.py`) :
- Sont gardées les corrections étiquetées « non_word_error » (le mot fautif n'existe pas) qui portent sur un seul mot. Le mot corrigé est rattaché à son lemme dans Lexique.
- Les mots à majuscule initiale sont ignorés : la correction porte souvent sur l'accent d'une capitale (*Eglise* → *Église*).
- Une faute devient un piège si :
  - elle **se prononce comme le mot juste**, d'après une clé de prononciation approximative (*notament*, *parmis*, *déja*, *occurence*) ;
  - elle revient au moins deux fois, et au moins une fois pour 100 occurrences par million de fréquence du mot ;
  - ce n'est pas une faute de frappe : lettres interverties, lettre triplée, voyelle doublée, lettre doublée en début ou en fin de mot.
- Ces fautes réelles sont les pièges prioritaires (règle « reel »). Le taux de fautes réelles du mot (fautes rapportées à sa fréquence) compte dans sa difficulté.

**Sélection** (`lexique_pieges.py`) :
- Lemmes de Lexique de 4 lettres ou plus : noms, adjectifs, adverbes, verbes, prépositions, conjonctions. Fréquence moyenne livres et films d'au moins 3 occurrences par million, ou d'au moins 1 pour un mot qui a des fautes réelles.
- D'abord tous les mots qui ont des fautes réelles, puis les plus fréquents, jusqu'à 2 000 mots.
- Les mots déjà présents dans `lexique.tsv` sont exclus des propositions (section 11).

**Fabrication des pièges** : des règles de réécriture produisent des fausses orthographes plausibles :
- consonne doublée ou non ;
- son [s] (s, ss, c, ç, sc, -tion / -ssion / -cion) ;
- ph, th, rh, ch prononcé [k], y ;
- h initial ou entre deux voyelles ;
- son [o] (o, au, eau, ô) ;
- voyelles nasales (an / en, in / ain / ein, m devant b et p) ;
- -amment / -emment ;
- [é] / [è] (é, er, et, ai, è, ê) ;
- -té / -tée ;
- accents oubliés (jamais sur î et û, admis sans accent depuis 1990) ;
- lettre finale muette absente ou changée ;
- qu / c, ge / j ;
- trait d'union, apostrophe.

Les règles et leur sélection :
- Un piège qui est un vrai mot de Lexique, sous n'importe quelle forme, est écarté. Un mot composé écrit en deux mots n'est pas proposé quand les deux mots existent séparément (*peut être*).
- Chaque règle a un poids de plausibilité. Le script garde jusqu'à trois pièges, les mieux notés, en variant les règles.
- Un mot n'est retenu que s'il a au moins deux pièges crédibles.

**Niveaux** : la difficulté d'un mot combine trois signaux, chacun ramené à son rang dans la liste (percentile) :
- **les pièges** : leur pouvoir de tromperie (le plus fort compte double), plus un bonus par difficulté réputée cumulée ;
- **la rareté** : un mot moins fréquent est moins familier à l'œil ;
- **les fautes réelles** : fautes relevées dans WiCoPaCo rapportées à la fréquence du mot.

Pondération : 35 % pièges, 25 % rareté, 40 % fautes réelles quand le mot en a. Sans faute réelle : 60 % pièges, 40 % rareté. Les quatre niveaux sont les quarts de cette difficulté, soit environ 500 mots chacun. Les mots qui n'ont que des pièges faibles se retrouvent au niveau 1, et les mots rares à fautes réelles fréquentes au niveau 4.

Pouvoir de tromperie de chaque règle :
- élevé pour -amment / -emment, consonne double oubliée, sc, -té / -tée ;
- moyen pour le son [s], le son [o], les voyelles nasales, h, ph, th, y ;
- faible pour un accent oublié ou une lettre finale fantaisiste.

Les pièges retenus pour un mot sont choisis parmi les plus plausibles et les plus trompeurs.

**Priorité de tirage** : 2 pour un mot à fautes réelles, 0,5 pour un mot qui n'a que des pièges faibles (lettre finale, accent, m devant b et p, an / en sur un mot courant), 1 sinon (voir 6b).

**Définitions** : une courte définition par mot, qui ne contient jamais le mot ni un mot de sa famille. La définition sert seulement à identifier le mot, puisque toutes les réponses sont des orthographes du même mot.

**Exclusions des propositions** (`lexique_construire.py`) : mots grossiers ou trop familiers, fréquents dans les sous-titres de films ; noms propres ; entrées douteuses de la base ; *noeud*, que la base écrit sans « œ » ; *quant* et *être*, déjà traités ailleurs ou ambigus.

**Explication affichée** : les fautes réellement fréquentes (« Faute très souvent commise : « notament » »), puis la liste des autres pièges du mot (« Pièges de ce mot : consonne simple ou double ; son nasal à plusieurs écritures… »), avec un lien vers la règle du site Prépa dictée.

**Chercher de nouveaux mots** (sans toucher à `lexique.tsv`) :

```
python3 -I outils/wicopaco_stats.py donnees/wicopaco/spelling_error-v3.xml donnees/wicopaco/wrhc-fr_070101-sch1-v2.xml.gz donnees/lexique383/Lexique383.tsv donnees/wicopaco_stats.tsv
python3 -I outils/lexique_pieges.py donnees/lexique383/Lexique383.tsv donnees/lexique_candidats.tsv <nombre> "" donnees/wicopaco_stats.tsv
python3 -I outils/lexique_construire.py donnees/lexique_candidats.tsv lexique.tsv donnees/lexique_propositions.tsv donnees/definitions_*.json
```

`lexique_propositions.tsv` a le même format que `lexique.tsv` et ne contient que des mots absents de `lexique.tsv`. Une proposition sans définition a une définition vide à écrire. Les lignes retenues se recopient dans `lexique.tsv` (section 11).

---

## 11. Modifier le lexique

`lexique.tsv` est la liste de référence : une ligne par mot, colonnes séparées par des tabulations, encodage UTF-8. Il s'ouvre dans LibreOffice Calc ou Excel (séparateur : tabulation, sans séparateur de texte) ou dans un éditeur de texte.

| Colonne | Contenu |
|---|---|
| `mot` | Le mot, unique ; c'est la première bonne réponse. |
| `niveau` | 1 à 4. |
| `priorite` | Priorité de tirage : 2 (fautes réelles), 1 (normal), 0.5 (pièges faibles). |
| `definition` | Énoncé affiché ; ne doit pas contenir le mot. |
| `bonnes_reponses` | Orthographes admises séparées par « / » (*clé / clef*). Plusieurs bonnes réponses : le joueur doit toutes les cocher (résultat neutre s'il n'en coche qu'une partie). |
| `pieges` | Fausses orthographes séparées par « / ». |
| `explication` | Texte affiché après la réponse. |
| `regle` | Ancre de la règle sur `../prepa-dictee-brevet/grammaire.html` : `doubles`, `usage`, `pluriels`… |
| `source` | `manuel`, `lexique` ou `wicopaco`. |
| `actif` | `oui` ou `non` : `non` retire le mot du jeu sans effacer la ligne. |

**Après chaque modification** :

```
python3 -I outils/lexique_vers_js.py
```

Le script vérifie le fichier, puis écrit `lexique-data.js` ; il suffit ensuite de recharger la page du jeu.
- **Erreurs bloquantes** : colonnes manquantes, mot en double, niveau ou priorité invalide, mot absent des bonnes réponses, aucun piège, piège identique à une bonne réponse. En cas d'erreur, `lexique-data.js` n'est pas modifié.
- **Avertissements** : moins de trois réponses proposées, définition qui contient le mot, règle inconnue.

Les scripts de génération (section 10) n'écrivent jamais dans `lexique.tsv`.

---

## 12. Grammaire

`grammaire.js` décrit 32 règles, 8 par niveau. Chaque règle fabrique une phrase à trou à partir d'un vocabulaire tiré au hasard :
- prénoms et groupes (*Léa*, *mon frère*, *les filles*, *mes cousins*), avec leur genre ;
- noms avec leur pluriel et leur genre ;
- adjectifs avec leurs quatre formes ;
- verbes et compléments compatibles avec tous les sujets (*chanter dans la chorale*, *prendre le bus*) ;
- participes passés avec leurs accords.

Les formes verbales viennent du moteur de conjugaison.

- **Statistiques** : elles portent sur la **règle**, pas sur la phrase. Une règle souvent ratée revient plus souvent ; la phrase, elle, change.
- **Pièges** : pour les homophones, les autres mots du groupe (*a / à*, *ces / ses / c'est / s'est*). Pour les accords, les autres formes de l'adjectif ou du participe. Pour les verbes, les formes du même temps aux autres personnes, en priorité celles qui se prononcent pareil.
- **Explication** : la règle et son astuce, avec un lien vers la page Grammaire du site Prépa dictée.
- **Nom de la règle** : affiché dans une étiquette **seulement après la réponse**, pour ne pas mettre sur la voie.
- **Indication** : quand la phrase demande de conjuguer, le verbe et le temps sont indiqués entre parenthèses (*(attendre, imparfait)*).

| Niveau | Règles |
|---|---|
| 1 | a / à · et / est · on / ont · son / sont · ou / où · accord du sujet et du verbe · accord du nom et de l'adjectif · -é / -er / -ez / -ait |
| 2 | ce / se · ces / ses / c'est / s'est · la / là / l'a · leur / leurs · sujet éloigné du verbe · participe passé avec être · participe passé avec avoir · pluriels particuliers |
| 3 | quel / quelle / qu'elle · peu / peut / peux · quand / quant / qu'en · sans / s'en · accord après « qui » · pronom complément devant le verbe · adjectifs de couleur · tout / tous / toute / toutes devant un nom |
| 4 | participe passé avec avoir et COD placé avant · participe passé des verbes pronominaux · vingt / cent / mille · tout devant un adjectif · même / mêmes · adjectif qui qualifie plusieurs noms · sujets de personnes différentes · participe passé employé seul |

**Ajouter une règle** : appeler `rule(id, niveau, nom, ancre, explication, générateur)` dans `grammaire.js`. Le générateur reçoit une fonction de hasard et renvoie `Q(phrase avec ___, bonne réponse, pièges)`. Pour garder l'équilibre, il faut autant de règles à chaque niveau.

---

## 13. Publication

- **Dépôt** : `xavinsky/orthostar` sur GitHub. Le site est publié par GitHub Pages à https://tekio.org/orthostar/.
- **Workflow** `.github/workflows/pages.yml`, lancé à chaque push sur `main` :
  1. `python3 outils/lexique_vers_js.py` vérifie `lexique.tsv` et génère `lexique-data.js` ; une erreur dans le lexique bloque la publication ;
  2. les fichiers du site sont copiés dans `_site/` (`index.html`, `*.js`, `style.css`) ;
  3. `_site/` est publié.
- **Fichiers ignorés par git** : `lexique-data.js` (généré) et `_site/` ; les sources brutes `donnees/lexique383/` et `donnees/wicopaco/` (117 Mo, à retélécharger, section 10).
- **En local** : lancer `python3 -I outils/lexique_vers_js.py` avant d'ouvrir `index.html`.
- **Liens vers le cours** : relatifs (`../prepa-dictee-brevet/…`). Ils fonctionnent en ligne (sites voisins sur tekio.org) et en local quand les dépôts `orthostar` et `prepa-dictee-brevet` sont côte à côte.
