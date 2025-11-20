# meteoSimplon

Application d'affichage météo.

## Fonctionnalités

- Affichage des conditions météo actuelles (température, conditions, icône)
- Informations détaillées : température minimale, altitude, coordonnées GPS
- Mise en cache des données (durée : 1 heure)
- Rafraîchissement automatique des données
- Mode mock pour le développement sans consommer le quota d'API
- Interface responsive adaptée aux écrans de différentes tailles

## Technologies utilisées

- HTML5
- CSS3 (avec dégradés et ombres)
- JavaScript vanilla (ES5+)
- API Météo-Concept
- Font Awesome pour les icônes
- sessionStorage pour le cache


## Configuration

### 1. Obtenir une clé API Météo-Concept

1. Rendez-vous sur [api.meteo-concept.com](https://api.meteo-concept.com/)
2. Créez un compte et générez une clé API gratuite

### 2. Configurer l'application

1. Copiez le fichier de configuration exemple :
   ```bash
   cp config/configuration.sample.json config/configuration.json
   ```

2. Éditez `config/configuration.json` avec vos informations :
   ```json
   {
       "API_KEY": "votre_clé_api_meteo_concept_ici",
       "ville": "Saint-Maxire",
       "code_insee": "79281"
   }
   ```

### 3. Trouver le code INSEE de votre ville

- Recherchez sur Google : `code insee [nom de votre ville]`
- Ou consultez le site INSEE

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-username/meteoSimplon.git
   cd meteoSimplon
   ```

2. Suivez les étapes de configuration ci-dessus

3. Lancez un serveur local :
   ```bash
   # Avec Python 3
   python -m http.server 8383
   
   # Avec PHP
   php -S localhost:8383
   
   # Avec Node.js (http-server)
   npx http-server -p 8383
   ```

4. Ouvrez votre navigateur à l'adresse : `http://localhost:8383`

## Utilisation

### Mode développement (mock)

Pour économiser votre quota d'appels API pendant le développement, 
éditez `scripts/meteofetch.js` :

```javascript
USE_MOCK: true,  // Utilise les données de mock-meteo.json
USE_TIMESTAMP: false  // Force le rafraîchissement à chaque appel
```

### Mode production

```javascript
USE_MOCK: false,  // Utilise l'API réelle Météo-Concept
USE_TIMESTAMP: true  // Active le cache d'1 heure
```

## Personnalisation

### Codes météo disponibles

L'application gère les codes météo suivants :
- 0: Ensoleillé
- 1-3: Peu nuageux / Nuageux
- 4-5: Très nuageux / Couvert
- 6-7: Brume / Brouillard
- 10-14: Pluie (faible à averses)
- 15: Orage
- 16-18: Neige (faible à forte)

### Modifier les couleurs

Éditez la fonction `getWeatherIconColor()` dans `meteofetch.js` 
pour personnaliser les couleurs des icônes selon les conditions météo.

## API Météo-Concept

### Endpoints utilisés

- **Recherche de ville** : `/api/location/cities?search={ville}&token={API_KEY}`
- **Prévisions** : `/api/forecast/daily?token={API_KEY}&insee={code_insee}&start=0&end=0`

### Limitations

- Quota gratuit : 500 appels/jour
- Cache : 1 heure (pour économiser le quota)

## Critères de qualité respectés

- Structure HTML fonctionnelle et cohérente
- CSS fonctionnel et lié correctement
- Données météo de la ville configurée
- Restitution correcte des données
- Rafraîchissement automatique toutes les heures
- Interface lisible et claire

## Améliorations possibles

1. **Prévisions sur plusieurs jours** : Afficher les prévisions J+1, J+2, etc.
2. **Graphiques** : Intégrer des graphiques de température avec Chart.js
3. **Animations** : Ajouter des animations CSS pour les transitions météo
4. **Multi-villes** : Gérer plusieurs villes dans la configuration
5. **Accessibilité** : Améliorer les contrastes et ajouter des attributs ARIA
6. **PWA** : Transformer en Progressive Web App pour le mode offline
7. **Internationalisation** : Support multilingue
8. **Alertes météo** : Afficher les alertes en cas de conditions extrêmes

## Auteur

Développé par Huby Franck dans le cadre du projet CDA Simplon

## Licence

Ce projet est un projet pédagogique pour la formation Concepteur Développeur d'Application.