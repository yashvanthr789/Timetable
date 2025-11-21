const Subject = require('../models/Subject');

// GET /subjects
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ code: 1 });
        res.json(subjects);
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /subjects
const createSubject = async (req, res) => {
    try {
        const { code, name, credits } = req.body;
        if (!code || !name || !credits) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const subject = await Subject.create({ code, name, credits });
        res.status(201).json(subject);
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /subjects/:id
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, credits } = req.body;
        const subject = await Subject.findByIdAndUpdate(
            id,
            { code, name, credits },
            { new: true, runValidators: true }
        );
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /subjects/:id
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByIdAndDelete(id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
};

