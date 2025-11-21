const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getStudentAttendance,
} = require('../controllers/attendanceController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/mark', protect, requireRole('admin', 'teacher'), markAttendance);
router.get('/student/:id', protect, getStudentAttendance);

module.exports = router;
