import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, sanitizeUser } from '../db.ts';
import {
  authenticateToken,
  AuthenticatedRequest,
  generateToken,
} from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res: Response): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: 'Name is required and must be at least 2 characters.',
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'A valid email address is required.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.findUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({
      success: false,
      message: 'An account with this email address already exists.',
    });
    return;
  }

  // Salted bcrypt password hash (Requirement 11)
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = db.createUser({
    name: name.trim(),
    email: normalizedEmail,
    role: 'customer', // Always customer on registration
    password: passwordHash,
  });

  const token = generateToken({
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
  });

  res.status(201).json({
    success: true,
    message: 'Account registered successfully.',
    data: {
      user: sanitizeUser(newUser),
      token,
    },
  });
});

// POST /api/auth/login
router.post('/login', (req, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.findUserByEmail(normalizedEmail);
  if (!user || !user.password) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password credentials.',
    });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password credentials.',
    });
    return;
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  res.status(200).json({
    success: true,
    message: 'Authentication successful.',
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const user = db.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User record not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(user),
    },
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters.',
    });
    return;
  }

  const updated = db.updateUser(req.user.id, { name: name.trim() });
  if (!updated) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user: sanitizeUser(updated),
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
