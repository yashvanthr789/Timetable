const Timetable = require('../models/Timetable');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
    '9:30–10:20',
    '10:20–11:10',
    '11:10–11:20',
    '11:20–12:10',
    '12:10–1:00',
    '1:00–2:00',
    '2:00–3:00',
    '3:00–4:00',
];

// GET /timetable
const getTimetable = async (req, res) => {
    try {
        const timetables = await Timetable.find();
        const ordered = timetables.sort(
            (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
        );
        res.json(ordered);
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// POST /timetable/save
const saveTimetable = async (req, res) => {
    try {
        const { timetable } = req.body;
        
        if (!timetable) {
            return res.status(400).json({ message: 'Timetable data is required' });
        }
        
        if (!Array.isArray(timetable)) {
            return res.status(400).json({ message: 'Timetable must be an array' });
        }
        
        if (timetable.length !== DAYS.length) {
            return res.status(400).json({ message: `Timetable must include all ${DAYS.length} days` });
        }

        const sanitized = [];
        const seenDays = new Set();
        
        for (const entry of timetable) {
            if (!entry || typeof entry !== 'object') {
                return res.status(400).json({ message: 'Invalid timetable entry format' });
            }
            
            if (!entry.day || !DAYS.includes(entry.day)) {
                return res.status(400).json({ message: `Invalid day: ${entry.day}. Must be one of: ${DAYS.join(', ')}` });
            }
            
            if (seenDays.has(entry.day)) {
                return res.status(400).json({ message: `Duplicate day found: ${entry.day}` });
            }
            seenDays.add(entry.day);
            
            if (!Array.isArray(entry.slots)) {
                return res.status(400).json({ message: `Slots must be an array for ${entry.day}` });
            }
            
            if (entry.slots.length !== TIME_SLOTS.length) {
                return res.status(400).json({ message: `Each day must contain exactly ${TIME_SLOTS.length} slots. ${entry.day} has ${entry.slots.length}` });
            }
            
            sanitized.push({
                day: entry.day,
                slots: entry.slots,
            });
        }

        // Ensure all days are present
        const providedDays = new Set(sanitized.map(e => e.day));
        const missingDays = DAYS.filter(day => !providedDays.has(day));
        if (missingDays.length > 0) {
            return res.status(400).json({ message: `Missing days: ${missingDays.join(', ')}` });
        }

        await Timetable.deleteMany({});
        await Timetable.insertMany(sanitized);

        res.json({ 
            message: 'Timetable saved successfully',
            timetable: sanitized 
        });
    } catch (error) {
        console.error('Save timetable error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Server error while saving timetable' });
    }
};

// DELETE /timetable/clear
const clearTimetable = async (req, res) => {
    try {
        await Timetable.deleteMany({});
        res.json({ message: 'Timetable cleared' });
    } catch (error) {
        console.error('Clear timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTimetable,
    saveTimetable,
    clearTimetable,
};

