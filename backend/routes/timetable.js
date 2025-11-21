const express = require('express');
const router = express.Router();
const {
    getTimetable,
    saveTimetable,
    clearTimetable,
} = require('../controllers/timetableController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, getTimetable);
router.post('/save', protect, requireRole('admin'), saveTimetable);
router.delete('/clear', protect, requireRole('admin'), clearTimetable);

module.exports = router;

