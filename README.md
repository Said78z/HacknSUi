# Hack'N'SUI - Soulbound NFT

Un projet de NFT soulbound (liés à l'âme) sur la blockchain Sui, permettant de créer des tokens non transférables qui restent attachés à un portefeuille spécifique.

## 📋 Description

Hack'N'SUI est une implémentation de NFT soulbound sur la blockchain Sui. Les NFT soulbound sont des tokens non transférables qui représentent des accomplissements, des identités ou des certificats qui restent liés à leur propriétaire d'origine.

## ✨ Fonctionnalités

- 🎫 Création de NFT soulbound personnalisés
- 🔒 Tokens non transférables (soulbound)
- 📱 Interface utilisateur intuitive
- 🔐 Sécurité renforcée avec la blockchain Sui
- 📊 Suivi des NFT soulbound par portefeuille
- 🎨 Métadonnées personnalisables

## 🛠️ Technologies

- **Blockchain**: Sui
- **Smart Contracts**: Move
- **Frontend**: (À définir)
- **Backend**: (À définir)

## 📦 Installation

### Prérequis

- Node.js (version 18 ou supérieure)
- Sui CLI installé
- Un portefeuille Sui configuré

### Étapes d'installation

```bash
# Cloner le repository
git clone <repository-url>
cd HacknSUi

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations
```

## 🚀 Utilisation

### Développement local

```bash
# Démarrer le serveur de développement
npm run dev

# Compiler les smart contracts Move
sui move build

# Tester les smart contracts
sui move test
```

### Déploiement

```bash
# Déployer sur testnet
npm run deploy:testnet

# Déployer sur mainnet
npm run deploy:mainnet
```

## 📁 Structure du projet

```
HacknSUi/
├── README.md
├── contracts/          # Smart contracts Move
├── frontend/           # Interface utilisateur
├── scripts/            # Scripts de déploiement
└── tests/              # Tests
```

## 🔧 Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
SUI_NETWORK=testnet
SUI_PRIVATE_KEY=your_private_key
CONTRACT_PACKAGE_ID=your_package_id
```

## 📝 Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Compiler le projet
- `npm run test` - Exécuter les tests
- `npm run deploy` - Déployer les smart contracts

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔗 Liens utiles

- [Documentation Sui](https://docs.sui.io/)
- [Documentation Move](https://move-language.github.io/move/)
- [Sui Explorer](https://suiexplorer.com/)

## 👥 Auteurs

- Votre nom - *Travail initial*

## 🙏 Remerciements

- L'équipe Sui pour leur excellent travail sur la blockchain
- La communauté open source

---

**Note**: Ce projet est en développement actif. Les fonctionnalités peuvent changer.
