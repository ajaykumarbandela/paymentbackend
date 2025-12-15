import express from 'express';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '../models/userModel.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[AUTH] Login attempt:', email);
    
    if (!email || !password) {
      console.log('[AUTH] Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await findUserByEmail(email);
    console.log('[AUTH] User found:', !!user);
    
    if (!user) {
      console.log('[AUTH] User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('[AUTH] Comparing passwords...');
    const match = await bcrypt.compare(password, user.password_hash);
    console.log('[AUTH] Password match:', match);
    
    if (!match) {
      console.log('[AUTH] Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('[AUTH] Login successful for:', email);
    // You can add JWT or session logic here if needed
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
