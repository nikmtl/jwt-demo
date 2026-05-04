# JWT `alg:none` Attack Demo

Dieses Projekt demonstriert den **JWT `alg:none` Angriff**.

Ein Angreifer mit einem normalen User-Account kann durch Manipulation des JWT-Headers Admin-Rechte erlangen – ohne das Server-Secret zu kennen.

---

## Projektstruktur

```
jwt-demo/
├── vulnerable-server.js   # Verwundbare App (Port 3000)
├── secure-server.js       # Gesicherte App (Port 3001)
├── attacker.js            # Angriffs-Skript
├── package.json
└── README.md
```

---

## Voraussetzungen

- [Node.js](https://nodejs.org/) v18 oder höher
- npm

---

## Installation

```bash
git clone https://github.com/nikmtl/jwt-demo
cd jwt-demo
npm install
```

---

## Starten

Drei separate Terminals öffnen:

**Terminal 1 – Verwundbarer Server:**
```bash
node vulnerable-server.js
# → Läuft auf http://localhost:3000
```

**Terminal 2 – Sicherer Server:**
```bash
node secure-server.js
# → Läuft auf http://localhost:3001
```

**Terminal 3 – Angriff ausführen:**
```bash
node attacker.js
```

---

## Was passiert

### Angriffs-Ablauf

1. Angreifer loggt sich als normaler User `alice` ein
2. Erhält einen gültigen JWT mit `role: user`
3. Dekodiert den Token (Base64 – kein Secret nötig)
4. Ändert `alg: HS256` → `alg: none` im Header
5. Ändert `role: user` → `role: admin` im Payload
6. Baut Token neu zusammen – ohne Signatur
7. Schickt manipulierten Token an `/admin`

### Erwarteter Output

```
=== JWT alg:none ATTACK DEMO ===

--- VULNERABLE SERVER (Port 3000) ---
Got legitimate token as alice (role: user)

[ORIGINAL TOKEN]
Header: { alg: 'HS256', typ: 'JWT' }
Payload: { user: 'alice', role: 'user' }

[MANIPULATED TOKEN]
Header: { alg: 'none', typ: 'JWT' }
Payload: { user: 'alice', role: 'admin' }

[ATTACKING VULNERABLE SERVER]
Status: 200
Response: { message: 'Welcome to the admin panel', user: 'alice' }

--- SECURE SERVER (Port 3001) ---

[ATTACKING SECURE SERVER]
Status: 401
Response: { error: 'Invalid token: algorithm not allowed' }
```

---

## Der entscheidende Code-Unterschied

Neuere Versionen von `jsonwebtoken` lehnen `alg:none` intern ab – selbst wenn es in der `algorithms`-Liste steht. Deshalb prüfen beide Server den Header **manuell**, bevor die Library ins Spiel kommt.

**Verwundbar:**
```javascript
// Header wird manuell dekodiert – alg:none wird akzeptiert und Signatur ignoriert
const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
if (header.alg === 'none') {
  decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) // kein Verify!
} else {
  decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] })
}
```

**Sicher:**
```javascript
// Header wird manuell dekodiert – alg:none wird sofort abgelehnt
const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
if (header.alg === 'none' || header.alg !== 'HS256') {
  return res.status(401).json({ error: 'Invalid token: algorithm not allowed' })
}
decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] })
```

Die Schwachstelle liegt nicht in der Library – sie liegt darin, dem Angreifer zu erlauben, den `alg`-Wert selbst zu kontrollieren.

---

## Test-Credentials

| Username | Password    | Rolle  |
|----------|-------------|--------|
| alice    | password123 | user   |
| admin    | admin456    | admin  |

---

## Routen

| Methode | Route    | Beschreibung                        |
|---------|----------|-------------------------------------|
| POST    | /login   | Login, gibt JWT zurück              |
| GET     | /admin   | Geschützter Admin-Bereich           |

### Beispiel Login (curl):
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'
```

### Beispiel Admin-Zugriff (curl):
```bash
curl http://localhost:3000/admin \
  -H "Authorization: Bearer <TOKEN>"
```