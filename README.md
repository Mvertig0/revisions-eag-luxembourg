# Révisions EAG Luxembourg

Site d'entraînement **indépendant** pour l'épreuve d'aptitude générale (EAG) de la fonction publique luxembourgeoise, groupe de traitement A1. Il n'est **pas affilié** à l'État luxembourgeois ni à GovJobs.

- 5 modules : raisonnement abstrait, raisonnement verbal, raisonnement numérique, planification, jugement situationnel.
- Chrono, correction expliquée, score, et une page « Mon suivi » avec la progression.
- Pas de compte, pas de serveur : les résultats restent dans le navigateur de l'appareil utilisé.

## Contenu et limites

- Tous les exercices sont **originaux** (écrits ou générés par programme). Aucune annale ni aucun site n'a été copié.
- GovJobs ne publie plus d'exemples de tests. Le format exact des épreuves, le nombre de questions et la durée de chaque test sont **inconnus** : ils sont estimés d'après la description officielle des tests. Les niveaux de difficulté sont des estimations.
- Sources officielles : [GovJobs, les tests de l'EAG](https://govjobs.public.lu/fr/nous-rejoindre/epreuve-aptitude-generale/tests-eag.html) et [la FAQ de l'EAG](https://govjobs.public.lu/fr/faq/faq-eag.html).

## Lancer le site sur son ordinateur

```bash
npm install
npm run dev        # développement
npm run build      # fabrique le site dans le dossier dist/
```

## Vérifications automatiques

Chaque module a un script qui recalcule les réponses d'une autre façon :

```bash
node scripts/verif-numerique.mjs
node scripts/verif-planification.mjs
node scripts/verif-situationnel.mjs
node scripts/verif-verbal.mjs
node scripts/verif-suivi.mjs
node src/modules/abstrait/verif.mjs
```

Les scripts `scripts/convertir-*.mjs` servent à rédiger le contenu : ils lisent des fichiers du dossier de travail complet du projet, qui n'est pas publié ici. Ils ne sont pas nécessaires pour faire marcher le site.

## Publication

Le site est publié automatiquement sur GitHub Pages à chaque envoi de code (voir `.github/workflows/deploy.yml`). Dans les réglages du dépôt : *Settings → Pages → Source : GitHub Actions*.
