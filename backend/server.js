require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Timetable Management API is running' });
});

app.use('/auth', authRoutes);
app.use('/subjects', subjectRoutes);
app.use('/timetable', timetableRoutes);
app.use('/users', userRoutes);
app.use('/attendance', attendanceRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

