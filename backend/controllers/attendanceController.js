const Attendance = require('../models/Attendance');

// POST /attendance/mark
const markAttendance = async (req, res) => {
    try {
        const { studentId, courseCode, date, status } = req.body;
        
        if (!studentId || !courseCode || !date || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['present', 'absent'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Check if attendance already marked for this student/course/date
        const existing = await Attendance.findOne({
            studentId,
            courseCode,
            date: new Date(date),
        });

        if (existing) {
            existing.status = status;
            existing.markedBy = req.user._id;
            await existing.save();
            return res.json({ message: 'Attendance updated', attendance: existing });
        }

        const attendance = await Attendance.create({
            studentId,
            courseCode,
            date: new Date(date),
            status,
            markedBy: req.user._id,
        });

        return res.status(201).json({ message: 'Attendance marked', attendance });
    } catch (error) {
        console.error('Mark attendance error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// GET /attendance/student/:id
const getStudentAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        
        const attendance = await Attendance.find({ studentId: id })
            .sort({ date: -1 })
            .populate('markedBy', 'name');

        return res.json(attendance);
    } catch (error) {
        console.error('Get student attendance error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    markAttendance,
    getStudentAttendance,
};
