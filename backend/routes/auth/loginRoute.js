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
    //Destruct object to extract email and password
    const { email, password } = req.body;
    //Check to make sure email and password are not empty
    if (!email || !password) {
        //Write 400 error message if they are empty saying they are required
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!fs.existsSync(dataPath('accounts.json'))) {
        return res.status(400).json({ message: 'No accounts found. Please sign up first.' });
    }

    const data = fs.readFileSync(dataPath('accounts.json'), 'utf-8');
    const accounts = JSON.parse(data);

    const user = accounts.find(account => account.email === email);
    //If there is no such user, then email or password must be invalid. This is deliberately vague so attackers don't know which went wrong
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    // Compare hash of password from the req.body with saved hash version. If original password is the same, they should hash to same value
    const passwordMatches = await bcrypt.compare(password, user.password);
    //If they do not hash to same value
    if (!passwordMatches) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    //Generates a random user ID for this session
    const sessionId = crypto.randomUUID();
    //Stores a mapping from sessionId to username
    sessions.set(sessionId, user.username);
    // Sends the sessionID to browser as cookie, so it can be sent back with future requests
    res.cookie('sessionId', sessionId);

    // Sends succes response including username so frontend knows who logged in
    res.json({
        message: 'Login successful! Welcome back.',
        username: user.username
    });
});

module.exports = router;