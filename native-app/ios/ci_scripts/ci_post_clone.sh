#!/bin/sh

# 1. Installer Node.js via Homebrew (nécessaire pour npm et expo)
export HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node

# 2. Vérifier que node et npm sont maintenant accessibles
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Aller à la racine du projet native-app
cd ../../

# 4. Installer les dépendances JS (nécessaire pour que le Podfile trouve expo/package.json)
npm install

# 5. Installer les Pods
cd ios
pod install