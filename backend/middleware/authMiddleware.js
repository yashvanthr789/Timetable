const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route (requires valid token)
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Optional auth (won't throw if token missing/invalid)
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.warn('Optional auth failed:', error.message);
        }
    }
    next();
};

// Role-based access
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = { protect, optionalAuth, requireRole };

