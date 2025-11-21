const express = require('express');
const router = express.Router();
const {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} = require('../controllers/usersController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, requireRole('admin'), getUsers);
router.post('/', protect, requireRole('admin'), createUser);
router.put('/:id', protect, requireRole('admin'), updateUser);
router.delete('/:id', protect, requireRole('admin'), deleteUser);

module.exports = router;
