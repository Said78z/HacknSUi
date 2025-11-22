# Architecture LémanFlow - Guide Technique Détaillé

Ce document détaille les choix architecturaux critiques selon l'audit pour optimiser le projet pour un hackathon Sui.

## 🏛️ Architecture On-Chain

### 1. Event comme Shared Object

**Choix Architectural** : L'objet `Event` est un **Shared Object** plutôt qu'un Owned Object.

**Justification** :
- Permet à des centaines de participants de valider des missions simultanément
- Évite les contentions d'état lors des pics de charge
- Exploite la parallélisation native de Sui

**Implémentation** :
```move
public fun share_event(event: Event) {
    transfer::share_object(event);
}
```

**Trade-off** : Légère latence supplémentaire due au consensus (Bullshark/Narwhal), mais nécessaire pour la scalabilité.

### 2. Passport SBT - Capacités Move Natives

**Choix Architectural** : Le Passport utilise uniquement la capacité `key`, sans `store`, `copy`, ou `drop`.

**Tableau des Capacités** :

| Capacité | Présent ? | Justification |
|----------|-----------|---------------|
| `key` | ✅ Oui | Permet UID et persistance dans le stockage global |
| `store` | ❌ Non | **Empêche le transfert libre (Soulbound)** |
| `copy` | ❌ Non | Garantit l'unicité du passeport |
| `drop` | ❌ Non | Empêche la destruction accidentelle |

**Avantage** : Cette implémentation native est plus robuste que les vérifications logiques dans Solidity. Le vérifieur de bytecode Sui rejette automatiquement toute tentative de transfert.

### 3. Dynamic Object Fields pour Attestations

**Choix Architectural** : Utilisation de **Dynamic Object Fields (DOF)** plutôt que Dynamic Fields simples pour les attestations.

**Justification** :
- Chaque attestation est un objet distinct avec son propre ID
- Permet la composabilité future (autres contrats peuvent référencer une attestation)
- Visible par les explorateurs et wallets tiers
- Prêt pour l'interopérabilité

**Implémentation** :
```move
dof::add(&mut passport.id, mission_id, attestation);
```

### 4. Dynamic Fields pour Missions

**Choix Architectural** : Utilisation de **Dynamic Fields** simples pour les missions attachées à l'Event.

**Justification** :
- Les missions sont des données internes à l'événement
- Pas besoin de composabilité individuelle pour les missions
- Gestion plus fine des frais de stockage (storage rebates)

## 🔐 Sécurité Multi-Couches

### Couche 1: Anti-Double-Claim On-Chain

**Implémentation** : Table `missions_completed` dans le Passport

```move
public struct Passport has key {
    missions_completed: Table<ID, u64>,
}
```

**Avantage** : 
- Parallélisation des écritures (chaque utilisateur modifie son propre Passport)
- Pas de hotspot centralisé dans le GrantPool
- Vérification atomique lors de la transaction

### Couche 2: Vérification Cryptographique Ed25519

**Implémentation** : Signature des QR codes avec Ed25519

**Flux** :
1. Backend génère un QR code avec signature Ed25519
2. Frontend scanne le QR et envoie la signature au contrat
3. Contrat vérifie la signature avec la clé publique de l'admin

```move
assert!(
    ed25519::verify(&signature, &pool.admin_public_key, &message),
    EInvalidSignature
);
```

**Message signé** : `sender_address || mission_id`

### Couche 3: Inspection de Transactions

**Implémentation Backend** : Vérification que la transaction sponsorisée appelle bien `complete_mission`

**Protection** : Empêche un utilisateur malveillant de créer une transaction `transfer_sui` vers son compte et de la faire sponsoriser.

### Couche 4: Rate Limiting

**Implémentation Backend** : Limitation du nombre de requêtes par IP et par compte zkLogin

**Protection** : Réduit l'impact du partage de QR codes statiques.

## 🔄 Flux d'Utilisateur Optimisé

### 1. Onboarding zkLogin

**Étapes** :
1. Utilisateur clique sur "Connecter avec Google"
2. Frontend génère une paire de clés éphémère
3. Backend retourne ou crée le salt persistant (basé sur `sub` du JWT)
4. Frontend génère la preuve ZK avec le service de preuve Sui
5. Utilisateur signe la transaction avec la clé éphémère
6. Transaction sponsorisée par le backend

**Point Critique** : Le salt doit être persistant pour que l'utilisateur retrouve le même compte Sui à chaque connexion.

### 2. Complétion de Mission

**Étapes** :
1. Utilisateur scanne un QR code
2. Frontend extrait `missionId` et `signature`
3. Frontend construit une transaction `complete_mission`
4. Utilisateur signe la transaction (zkLogin ou wallet)
5. Transaction envoyée à `/api/claim`
6. Backend inspecte la transaction
7. Backend signe avec `SPONSOR_PRIVATE_KEY`
8. Transaction soumise au réseau Sui
9. Finalité en ~400ms (vitesse de Sui)

### 3. Visualisation du Passeport

**Données Affichées** :
- Nombre total de missions complétées
- Liste des attestations avec badges
- Récompenses accumulées
- Historique des complétions

**Future** : Intégration du standard Display de Sui pour affichage automatique dans les wallets.

## 📊 Optimisations de Performance

### Parallélisation des Transactions

Grâce aux Shared Objects et aux Owned Objects (Passport), les transactions peuvent être parallélisées :
- Utilisateur A modifie son Passport → Transaction 1
- Utilisateur B modifie son Passport → Transaction 2
- Ces transactions peuvent être exécutées en parallèle

### Réduction des Frais de Gaz

- Utilisation de Dynamic Fields pour éviter la désérialisation de grands vecteurs
- Storage rebates lors de la suppression de missions
- Transactions sponsorisées pour l'utilisateur final

## 🚀 Points de Différenciation pour le Hackathon

1. **Architecture Native Sui** : Exploitation complète du modèle d'objets
2. **Sécurité Institutionnelle** : Vérifications cryptographiques et anti-double-claim
3. **UX Sans Friction** : zkLogin réel (pas de mock) + transactions sponsorisées
4. **Composabilité Future** : Dynamic Object Fields pour interopérabilité
5. **Scalabilité** : Architecture parallélisée pour supporter des milliers d'utilisateurs

## 🔮 Évolutions Futures

### Court Terme
- Standard Display de Sui pour métadonnées
- SVG dynamique pour génération d'images de passeport
- Intégration avec wallets tiers

### Long Terme
- Décentralisation de la vérification via réseau de nœuds
- Private Objects pour confidentialité des attestations
- Zero-Knowledge Credentials pour preuve sans révélation

## 📚 Références Techniques

- [Sui Documentation - Objects](https://docs.sui.io/learn/objects)
- [Sui Documentation - Dynamic Fields](https://docs.sui.io/learn/objects/dynamic-fields)
- [Sui Documentation - zkLogin](https://docs.sui.io/guides/developer/zklogin)
- [Move Language - Abilities](https://move-language.github.io/move/abilities.html)

