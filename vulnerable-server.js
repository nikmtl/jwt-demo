// vulnerable-server.js
const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const SECRET = 'supersecretkey123'
const PORT = 3000

// Fake User Database
const users = {
  alice: { password: 'password123', role: 'user' },
  admin: { password: 'admin456', role: 'admin' }
}

// Login Route - gibt JWT zurück
app.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = users[username]

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { user: username, role: user.role },
    SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  )

  res.json({ token })
})

// Protected Admin Route
app.get('/admin', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  const token = authHeader.split(' ')[1]

  try {
    // VERWUNDBAR: kein algorithms Parameter
    const decoded = jwt.verify(token, SECRET)

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not an admin' })
    }

    res.json({ message: 'Welcome to the admin panel', user: decoded.user })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

app.listen(PORT, () => console.log(`Vulnerable server running on port ${PORT}`))