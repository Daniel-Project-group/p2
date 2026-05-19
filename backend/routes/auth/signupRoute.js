// Imports
const express = require('express');
const bcrypt = require('bcrypt');

// Helper function
const { readJson, writeJson } = require("../../utils/jsonDb");

const router = express.Router();

    // Signup post route that is asynchronious due to waiting for hashing of password
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;
    //If there missing any of the fields, return a 400 (bad request) error with message saying all three are required
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // We call the helper which returns an array
    const accounts = readJson("accounts.json");
   
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

    //await hashed password using bcrypt.hash with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Push account to accounts array using hashedPassword as password
    accounts.push({ username: username, email: email, password: hashedPassword });

    // We write to json by calling helper function
    writeJson("accounts.json", accounts);

    // Send a succes response that account was created succesfully
    res.json({ message: 'Account created successfully!' });
});

module.exports = router;
