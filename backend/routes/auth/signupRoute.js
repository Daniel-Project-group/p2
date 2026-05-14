// Imports
const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// Signup route
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    let accounts = [];
    if (fs.existsSync(dataPath('accounts.json'))) {
        const data = fs.readFileSync(dataPath('accounts.json'), 'utf-8');
        accounts = JSON.parse(data);
    }

    // Check if email is already registered
    const existingUser = accounts.find(account => account.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Check if username is taken
    const existingUsername = accounts.find(account => account.username === username);
    if (existingUsername) {
        return res.status(400).json({ message: 'This username is already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the new account
    accounts.push({ username: username, email: email, password: hashedPassword });

    // Save to file
    fs.writeFileSync(dataPath('accounts.json'), JSON.stringify(accounts, null, 2));

    res.json({ message: 'Account created successfully!' });
});

module.exports = router;
