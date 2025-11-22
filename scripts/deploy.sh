#!/bin/bash

# Script de déploiement pour LémanFlow
# Usage: ./scripts/deploy.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}
CONTRACTS_DIR="contracts/leman_flow"

echo "🚀 Déploiement de LémanFlow sur $NETWORK"

# Vérifier que Sui CLI est installé
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI n'est pas installé. Installez-le d'abord."
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo "❌ Répertoire $CONTRACTS_DIR introuvable"
    exit 1
fi

# Compiler les contrats
echo "📦 Compilation des contrats Move..."
cd "$CONTRACTS_DIR"
sui move build

# Exécuter les tests
echo "🧪 Exécution des tests..."
sui move test

# Déployer
echo "📤 Déploiement sur $NETWORK..."
sui client publish --gas-budget 100000000 --json > ../../deployment.json

echo "✅ Déploiement terminé!"
echo "📄 Détails du déploiement sauvegardés dans deployment.json"

# Extraire le Package ID
PACKAGE_ID=$(cat ../../deployment.json | grep -o '"packageId":"[^"]*' | cut -d'"' -f4)
echo "📦 Package ID: $PACKAGE_ID"

# Retourner au répertoire racine
cd ../..

echo ""
echo "🎉 Déploiement réussi!"
echo "📝 N'oubliez pas de mettre à jour vos variables d'environnement avec le Package ID"

