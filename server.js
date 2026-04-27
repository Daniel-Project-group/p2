// Import the packages we installed
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');

// Create the Express app
const app = express();
const PORT = 3000;

// Middleware - tells Express to handle JSON and allow requests from our HTML pages
app.use(cors());
app.use(express.json());

// A simple test route - just to check the server works
app.get('/', (req, res) => {
    res.send('Server is running!');
});
// Signup route - this runs when someone submits the signup form
app.post('/signup', async (req, res) => {
    // Get the email and password from the request
    const { email, password } = req.body;

    // Check that email and password were sent
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Read the existing accounts file (or start with empty array if it doesn't exist)
    let accounts = [];
    if (fs.existsSync('accounts.json')) {
        const data = fs.readFileSync('accounts.json', 'utf-8');
        accounts = JSON.parse(data);
    }

    // Check if this email is already registered
    const existingUser = accounts.find(account => account.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Hash the password (encrypt it so we never store plain passwords)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the new account
    accounts.push({ email: email, password: hashedPassword });

    // Save the updated accounts back to the file
    fs.writeFileSync('accounts.json', JSON.stringify(accounts, null, 2));

    // Send a success response
    res.json({ message: 'Account created successfully!' });
});
// Login route - this runs when someone submits the login form
app.post('/login', async (req, res) => {
    // Get the email and password from the request
    const { email, password } = req.body;

    // Check that email and password were sent
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if the accounts file exists
    if (!fs.existsSync('accounts.json')) {
        return res.status(400).json({ message: 'No accounts found. Please sign up first.' });
    }

    // Read the accounts file
    const data = fs.readFileSync('accounts.json', 'utf-8');
    const accounts = JSON.parse(data);

    // Find the user with this email
    const user = accounts.find(account => account.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the password with the stored hashed password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Success!
    res.json({ message: 'Login successful! Welcome back.' });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});