# oriTrail Mobile App - ionic3
Projet de course d'orientation.

Application mobile multiplateforme (iOS/Android) basée sur Ionic 3.

Objectif :
Pouvoir participer à une course d'orientation (ou basée sur des points d'intérêt) en suivant le temps et les coordonnées GPS grâce à un scan de QRCode ! L'application est réalisée pour fonctionner conjointement avec le backend : [l'application web](https://github.com/joedu12/oriTrail-slim3).

----
## Contribuer au projet

[Documentation de ionic](https://ionicframework.com/docs/)

Installer [Node.js](http://nodejs.org/)

Installer [git](https://git-scm.com/)    
    ```console
    git clone https://github.com/joedu12/oriTrail-ionic3.git   
    cd oriTrail-ionic3   
    npm install -g cordova ionic   
    ionic serve   
    ```

Déploiement iOS     
    Ouvrir le dossier platform/ios avec Xcode, signer le projet puis :    
    ```console
    ionic cordova run ios -l -c -s --debug
    ```

Versioning :
    Il faut installer cordova 7.1.0 afin de rendre le plugin de QRCode fonctionnel avec le code :    
    ```console
    npm uninstall -g cordova && npm install -g cordova@7.1.0
    ```   
---
## Technologies intégrées à Ionic :
- Angular 4
- TypeScript
- Cordova
- Node.js
- Saas