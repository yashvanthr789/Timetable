const bcrypt = require('bcrypt');
const User = require('../models/User');

const sanitizeUser = (user) => ({
    id: user._id,
    username: user.username,
    role: user.role,
    name: user.name,
});

// GET /users?role=teacher or ?role=student
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = {};
        
        if (role && ['admin', 'teacher', 'student'].includes(role)) {
            filter.role = role;
        }
        
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json(users.map(sanitizeUser));
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /users
const createUser = async (req, res) => {
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

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            role,
            name,
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// PUT /users/:id
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, name, role, password } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) user.username = username;
        if (name) user.name = name;
        if (role && ['admin', 'teacher', 'student'].includes(role)) {
            user.role = role;
        }
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        return res.json({
            message: 'User updated successfully',
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /users/:id
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
};
