// Import the packages we installed
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');

// Create the Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// A simple test route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    let accounts = [];
    if (fs.existsSync('accounts.json')) {
        const data = fs.readFileSync('accounts.json', 'utf-8');
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
    fs.writeFileSync('accounts.json', JSON.stringify(accounts, null, 2));

    res.json({ message: 'Account created successfully!' });
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!fs.existsSync('accounts.json')) {
        return res.status(400).json({ message: 'No accounts found. Please sign up first.' });
    }

    const data = fs.readFileSync('accounts.json', 'utf-8');
    const accounts = JSON.parse(data);

    const user = accounts.find(account => account.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Send back username so frontend can save it
    res.json({
        message: 'Login successful! Welcome back.',
        username: user.username
    });
});
// Create new task route
app.post('/newtask', (req, res) => {
    const { title, description, quantity, duedate, oriented, createdBy } = req.body;

    // Validate required fields
    if (!title || !duedate || !oriented || !createdBy) {
        return res.status(400).json({ message: 'Title, due date, task type, and creator are required' });
    }

    // Read existing tasks (or start empty)
    let tasks = [];
    if (fs.existsSync('tasks.json')) {
        const data = fs.readFileSync('tasks.json', 'utf-8');
        tasks = JSON.parse(data);
    }

    // Create new task object
    const newTask = {
        id: Date.now(),
        title: title,
        description: description,
        quantity: parseInt(quantity) || 1,
        duedate: duedate,
        oriented: oriented,
        createdBy: createdBy,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Add to array
    tasks.push(newTask);

    // Save to file
    fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task created successfully!', task: newTask });
});

app.post('/savecompetence', (req, res) => {
    const { username, ratings } = req.body;


    if (!username || !ratings) {
        return res.status(400).json({ message: 'Username and ratings are required' });
    }

    let profiles = [];
    if (fs.existsSync('competences.json')) {
        const data = fs.readFileSync('competences.json', 'utf-8');
        if (data.trim()) {
            profiles = JSON.parse(data);
        }
    }


    const existingIndex = profiles.findIndex(p => p.username === username);

    const profileData = {
        username: username,
        ratings: ratings,
        updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {

        profiles[existingIndex] = profileData;
    } else {

        profiles.push(profileData);
    }

    // Save to file
    fs.writeFileSync('competences.json', JSON.stringify(profiles, null, 2));

    res.json({ message: 'Competence profile saved!' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});