#!/bin/sh

# On remonte à la racine du projet native-app
cd ../../

# Installer les dépendances JavaScript
npm install

# Aller dans le dossier ios et installer les Pods
cd ios
pod install