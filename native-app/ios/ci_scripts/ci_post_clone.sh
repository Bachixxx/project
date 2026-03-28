#!/bin/sh

# 1. Installer Node.js via Homebrew
export HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node

# 2. Aller à la racine du projet native-app
cd ../../

# 3. Installer les dépendances JS en forçant la résolution des conflits
# C'est l'étape cruciale pour ignorer le conflit lucide-react-native / React 19
npm install --legacy-peer-deps

# 4. Installer les Pods
# On supprime le Podfile.lock pour le régénérer proprement
# car npm install (sans lock) peut résoudre des versions plus récentes
cd ios
rm -f Podfile.lock
pod install --repo-update