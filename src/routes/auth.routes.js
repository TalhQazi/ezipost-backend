const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser
} = require('../controllers/authController');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
