const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sanitizeUser = (user) => ({
    id: user._id,
    username: user.username,
    role: user.role,
    name: user.name,
});

// POST /auth/register
const register = async (req, res) => {
    try {
        const { username, password, role = 'student', name } = req.body;
        if (!username || !password || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;

        // Allow first user creation without auth (bootstrap admin)
        if (!isFirstUser) {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can register users' });
            }
            if (role === 'admin' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can create admins' });
            }
        } else if (role !== 'admin') {
            return res.status(400).json({ message: 'First user must be an admin account' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            role,
            name,
        });

        return res.status(201).json({
            message: 'User registered successfully',
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// POST /auth/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        return res.json({
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// GET /auth/me
const getMe = async (req, res) => {
    return res.json({ user: sanitizeUser(req.user) });
};

module.exports = {
    register,
    login,
    getMe,
};

