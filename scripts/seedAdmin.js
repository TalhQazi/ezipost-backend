const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists.');
            return;
        }

        const admin = new User({
            username: 'admin',
            email: 'admin@ezpost.com',
            password: 'adminpassword123',
            role: 'admin'
        });

        await admin.save();
        console.log('Default admin user created:');
        console.log('Username: admin');
        console.log('Password: adminpassword123');

    } catch (err) {
        console.error('Error seeding admin:', err.message);
    } finally {
        mongoose.connection.close();
    }
};

seedAdmin();
