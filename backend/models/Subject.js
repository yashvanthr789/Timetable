const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
        },
        credits: {
            type: Number,
            required: true,
            enum: [2, 3, 4],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);

