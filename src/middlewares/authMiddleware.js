import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'Token required' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }
}
