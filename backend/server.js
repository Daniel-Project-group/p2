

// Import the packages we installed
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Route auth imports 
const authRoute = require('./routes/auth/authRoute');

// Route imports
const taskRoute = require('./routes/taskRoute');
const groupRoute = require('./routes/groupRoute');
const sprintRoute = require('./routes/sprintRoute');
const userProfile = require('./route/userProfile');
const competenceList = require('/routes/competenceRoute');


// Create the Express app
const app = express();
const PORT = 3000;

// Makes sure it can always find a specific file
// no matter where the server was launched from
const dataPath = (file) => path.join(__dirname, 'json', file);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
const sessions = new Map();

// Actual route uses
// Auth
app.use('/auth', authRoute);
// Protected
app.use('/tasks', taskRoute);
app.use('/groups', groupRoute);
app.use('/sprints', sprintRoute);
app.use('/profiles', userProfile);
app.use('/competences', competenceList);

app.use(express.static(path.join(__dirname, '../frontend')));



// A simple test route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});