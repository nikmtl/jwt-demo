// secure-server.js
const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const SECRET = 'supersecretkey123'
const PORT = 3001

const users = {
  alice: { password: 'password123', role: 'user' },
  admin: { password: 'admin456', role: 'admin' }
}

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

app.get('/admin', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  const token = authHeader.split(' ')[1]

  try {
    // SICHER: algorithms explizit fixiert
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] })

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not an admin' })
    }

    res.json({ message: 'Welcome to the admin panel', user: decoded.user })
  } catch (err) {
    res.status(401).json({ error: `Invalid token: ${err.message}` })
  }
})

app.listen(PORT, () => console.log(`Secure server running on port ${PORT}`))