const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const envUri = (process.env.MONGO_URI || '').trim();
        const fallbackUri = 'mongodb://127.0.0.1:27017/timetable_db';
        let connectionUri = envUri || fallbackUri;

        // If the URI doesn’t specify a database (ends with / or has no slash),
        // append the default timetable database name.
        if (!connectionUri.match(/\/[^/?]+$/)) {
            if (connectionUri.endsWith('/')) {
                connectionUri += 'timetable_db';
            } else {
                connectionUri += '/timetable_db';
            }
        }

        if (!envUri) {
            console.warn(
                '[MongoDB] No MONGO_URI provided. Falling back to local instance at mongodb://127.0.0.1:27017/timetable_db'
            );
        }

        const conn = await mongoose.connect(connectionUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.error('Please ensure MONGO_URI is set in backend/.env or a local MongoDB server is running.');
        process.exit(1);
    }
};

module.exports = connectDB;

