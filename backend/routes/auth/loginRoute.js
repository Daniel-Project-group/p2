// Imports
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const sessions = require('../../sessionStorage');

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// Login route
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!fs.existsSync(dataPath('accounts.json'))) {
        return res.status(400).json({ message: 'No accounts found. Please sign up first.' });
    }

    const data = fs.readFileSync(dataPath('accounts.json'), 'utf-8');
    const accounts = JSON.parse(data);

    const user = accounts.find(account => account.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    // A cookie is imprinted on that login
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, user.username);
    res.cookie('sessionId', sessionId);

    // Send back username so frontend can save it
    res.json({
        message: 'Login successful! Welcome back.',
        username: user.username
    });
});