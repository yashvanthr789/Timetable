const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
    {
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            required: true,
            unique: true,
        },
        slots: {
            type: [String],
            validate: [(arr) => arr.length === 8, 'Slots array must contain 8 entries'],
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);

