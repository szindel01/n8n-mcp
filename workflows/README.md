# 📧 Email Management Workflows

Des workflows n8n prêts à l'emploi pour gérer les emails via la solution multi-boîtes mails n8n-mcp.

## 🚀 Workflows Disponibles

### 1. **Email Setup** - `email-setup-workflow.json`
Configure les comptes Gmail et IMAP.

**Utilisation:**
1. Importer le workflow dans n8n
2. Modifier les paramètres:
   - `accountName`: Nom du compte
   - `email`: Adresse email
   - `provider`: `gmail` ou `imap`
   - Pour Gmail: `refreshToken` (token OAuth)
   - Pour IMAP: `host`, `port`, `username`, `password`
3. Exécuter le workflow
4. Vérifier la liste des comptes configurés

**Exemple Gmail:**
```json
{
  "accountName": "Personal Gmail",
  "email": "you@gmail.com",
  "provider": "gmail",
  "refreshToken": "1//0gF8...",
  "customUrgentKeywords": ["urgent", "ASAP"]
}
```

**Exemple IMAP:**
```json
{
  "accountName": "Work Outlook",
  "email": "name@company.com",
  "provider": "imap",
  "host": "outlook.office365.com",
  "port": 993,
  "username": "name@company.com",
  "password": "YOUR_APP_PASSWORD"
}
```

---

### 2. **Email Search - Urgent** - `email-search-urgent-workflow.json`
Récupère automatiquement les emails urgents et importants.

**Fonctionnalités:**
- ⏱️ S'exécute toutes les 5 minutes
- 🚨 Affiche les emails urgents (> 30%)
- ⭐ Affiche les emails importants (> 30%)
- 📨 Envoie une notification Slack
- 📊 Génère un rapport HTML

**Configuration:**
1. Connecter Slack (optionnel)
2. Définir le canal Slack: `#emails`
3. Activer le workflow avec le toggle "Active"

**Résultat:**
```
🚨 URGENT (3):
  • Critical meeting today (100%)
  • Action required (85%)
  • Deadline tomorrow (70%)

⭐ IMPORTANT (5):
  • Contract review (95%)
  • Approval needed (80%)
```

---

### 3. **Email Search - Custom** - `email-custom-search-workflow.json`
Cherche des emails avec des critères personnalisés.

**Syntaxe de recherche:**
```
from:john@example.com          # Par expéditeur
subject:meeting                # Par sujet
is:unread                      # Emails non lus
has:attachments                # Avec pièces jointes
before:2025-02-10              # Avant une date
after:2025-02-01               # Après une date
```

**Exemples:**
- `from:boss@company.com subject:urgent` - Emails urgents du boss
- `has:attachments is:unread` - Emails non lus avec pièces jointes
- `subject:invoice after:2025-01-01` - Factures de janvier

**Paramètres:**
```json
{
  "query": "subject:meeting",
  "maxResults": 50,
  "minUrgency": 0.3
}
```

**Résultat:**
- Tableau groupé par compte email
- Score d'urgence/importance
- Statut de lecture
- Date de réception

---

### 4. **Account Management** - `email-account-management-workflow.json`
Gère les comptes email: activation, désactivation, mise à jour.

**Actions disponibles:**
- ✏️ **Update Keywords** - Modifier les mots-clés urgents/importants
- ⏸️ **Disable Account** - Désactiver temporairement
- ▶️ **Enable Account** - Réactiver un compte
- 🗑️ **Remove Account** - Supprimer définitivement

**Exemple - Mettre à jour les mots-clés:**
```json
{
  "action": "update_keywords",
  "account_id": 1,
  "customUrgentKeywords": ["urgent", "ASAP", "NOW"],
  "customImportantKeywords": ["meeting", "decision"]
}
```

**Exemple - Désactiver un compte:**
```json
{
  "action": "disable",
  "account_id": 2
}
```

---

## 📋 Installation & Utilisation

### Étape 1: Importer les Workflows
```bash
# Dans l'interface n8n:
# 1. Cliquer sur "Create > Import from URL"
# 2. Coller l'URL du fichier JSON
# OU copier/coller le contenu du fichier JSON directement
```

### Étape 2: Configurer les Credentials
1. **MCP Connection** - Configurer la connexion au serveur MCP
   - Endpoint: `http://localhost:3000` (ou votre URL)
   - Auth Token: (si applicable)

2. **Slack Connection** (optionnel)
   - Pour recevoir les notifications

### Étape 3: Personnaliser les Paramètres
Chaque workflow a une section "Set Parameters" à modifier:

```javascript
// Exemple pour recherche
{
  "query": "subject:meeting",
  "maxResults": 50,
  "minUrgency": 0.3
}
```

### Étape 4: Exécuter
- Pour test: Cliquer "Execute Workflow"
- Pour automatisation: Activer "Active" toggle

---

## 🔍 Syntaxe de Recherche Avancée

### Opérateurs Disponibles

| Opérateur | Exemple | Résultat |
|-----------|---------|----------|
| `from:` | `from:john@example.com` | Emails de John |
| `to:` | `to:manager@company.com` | Emails à Manager |
| `subject:` | `subject:urgent` | Sujet contient "urgent" |
| `is:unread` | `is:unread` | Emails non lus |
| `is:important` | `is:important` | Emails importants |
| `is:urgent` | `is:urgent` | Emails urgents |
| `has:attachments` | `has:attachments` | Avec pièces jointes |
| `before:` | `before:2025-02-15` | Avant cette date |
| `after:` | `after:2025-02-01` | Après cette date |

### Combiner les Critères
```
from:boss@company.com is:unread has:attachments
  → Emails non lus de boss avec pièces jointes

subject:invoice after:2025-01-01 before:2025-02-01
  → Factures de janvier

is:urgent OR is:important
  → Emails urgents OU importants
```

---

## 📊 Interprétation des Scores

### Score d'Urgence (0.0 - 1.0)
- **0.8 - 1.0** 🔴 Critique - Demande action immédiate
- **0.5 - 0.7** 🟠 Haute - À traiter rapidement
- **0.3 - 0.5** 🟡 Normale - À traiter prochainement
- **0.0 - 0.3** 🟢 Basse - Peut attendre

### Score d'Importance (0.0 - 1.0)
- **0.8 - 1.0** 🔴 Critique - Affecte les décisions
- **0.5 - 0.7** 🟠 Haute - Important à connaître
- **0.3 - 0.5** 🟡 Normale - Utile à lire
- **0.0 - 0.3** 🟢 Basse - Information générale

### Facteurs de Scoring

**Urgence (+):**
- Mots-clés: "urgent", "ASAP", "critical", "emergency"
- Email non lu (+0.2)
- Reçu récemment < 24h (+0.15)
- Marqué comme important Gmail (+0.3)

**Importance (+):**
- Mots-clés: "meeting", "contract", "proposal", "approval"
- Avec pièces jointes (+0.25)
- Non lu (+0.1)

---

## 🔐 Configuration Sécurité

### Credentials Gmail
1. Aller sur https://console.cloud.google.com
2. Créer un projet
3. Activer Gmail API
4. Créer des identifiants OAuth 2.0
5. Obtenir le `refreshToken` via le flow OAuth

### Credentials IMAP
1. Utiliser un mot de passe d'application (pas le vrai mot de passe)
2. Pour Office 365: Créer une authentification par app
3. Pour Gmail IMAP: Générer un mot de passe d'application

### Secrets d'Encryption
Dans les variables d'environnement n8n:
```bash
EMAIL_ENCRYPTION_KEY=your-32-byte-hex-key
```

---

## 🐛 Troubleshooting

### "Connection refused to MCP server"
- Vérifier que le serveur MCP est lancé: `npm start:http`
- Vérifier l'URL et le port
- Vérifier les pare-feu

### "Gmail API error 401"
- Renouveler le refresh token
- Vérifier que GOOGLE_CLIENT_ID et SECRET sont configurés

### "IMAP connection timeout"
- Vérifier host et port (993 pour TLS)
- Vérifier le mot de passe d'application
- Vérifier la connectivité réseau

### "No emails found"
- Vérifier que les comptes email sont actifs
- Modifier le mailbox par défaut
- Vérifier les critères de recherche

---

## 📝 Exemples Complets

### Workflow: Escalade des emails urgents
```json
1. Chercher emails urgents (urgency > 0.7)
2. Si trouvé:
   - Envoyer notification Slack
   - Créer ticket dans Jira
   - Ajouter à Google Calendar
3. Enregistrer le rapport
```

### Workflow: Nettoyage et classification
```json
1. Lister tous les emails non lus
2. Classifier par urgence/importance
3. Déplacer vers dossiers correspondants
4. Marquer comme lu
5. Archiver les anciens
```

### Workflow: Rapport quotidien
```json
1. Chaque matin à 8h:
   - Récupérer emails urgents
   - Récupérer emails importants
   - Générer rapport HTML
   - Envoyer par email au manager
```

---

## 🚀 Déploiement en Production

### Activer les Workflows
```bash
# Interface n8n
1. Workflow > Toggle "Active"
2. Configurer schedule/trigger
3. Tester une fois
4. Activer
```

### Monitoring
- Vérifier les logs n8n: `docker logs n8n`
- Monitorer les erreurs MCP
- Configurer les webhooks d'erreur

### Backup
```bash
# Exporter les workflows
cp workflows/*.json backup/$(date +%Y%m%d)/
```

---

## 📞 Support

Pour les problèmes:
1. Vérifier les logs du serveur MCP
2. Vérifier la configuration des credentials
3. Tester avec des requêtes simples d'abord
4. Consulter la documentation n8n

---

**Dernière mise à jour:** 2025-02-12
**Version n8n:** Compatible 1.0+
**Version n8n-mcp:** 2.29.0+
