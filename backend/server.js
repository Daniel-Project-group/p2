

// Import the packages we installed
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Create the Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cookieParser());
const sessions = new Map();

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

// Creating group route
app.post('/groupCreate', (req,res) =>{
const {name,groupCode,username} = req.body;

// We validate the data
    if(!name || !groupCode || !username){
        return res.status(400).json({message: 'Name and Id required'});
    }
    // We read existing groups stored in json to add the new
    let groups = [];
    if(fs.existsSync('group.json')){
        const data = fs.readFileSync('group.json', 'utf-8');
        groups = JSON.parse(data);
    }

    // New group object
    const newGroup = {
        name: name,
        groupCode: groupCode,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        members: [username] // Upon creation the given username is stored
    }

    // We add to array

    groups.push(newGroup);

    // Save to file
    fs.writeFileSync('group.json', JSON.stringify(groups, null, 2)); 
    // groups is the data going to json file Null means we dont filter or transfrom 2: format with 2 spaces indentation in json file 

    res.json({ message: 'Task created successfully!', groups: newGroup });

});

// We make a get for group id - this needs to check is the typed group ID exists, if thats the case, we join that

app.post('/groupJoin', (req,res) => {
    const{groupCode} = req.body;
    
// Now the group ids in json is read

    let groups = [];
    if(fs.existsSync('group.json')){
        const data = fs.readFileSync('group.json', 'utf-8');
        groups = JSON.parse(data);
    }

    // We need a const/variable for when whatever input from frontend matches whats in group.json
    const matchingGroup = groups.find(function(group){
        return group.groupCode === groupCode;
    })
    if(matchingGroup){
        // Assignment due:
        // Here the user needs to be stored in the given groups member property array
    }
});

// Create new task route
app.post('/newtask', (req, res) => {
    const { group,title, description, quantity, duedate, oriented, createdBy } = req.body;

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
        groupId: group,                   // unique ID (timestamp)
        title: title,
        description: description,
        quantity: parseInt(quantity) || 1,
        duedate: duedate,
        oriented: oriented,
        createdBy: createdBy,
        status: 'pending',                 // for project leader to confirm later
        createdAt: new Date().toISOString()
    };

    // Add to array
    tasks.push(newTask);

    // Save to file
    fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task created successfully!', task: newTask });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});