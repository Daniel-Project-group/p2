

// Import the packages we installed
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Route imports 

const authRoute = require('./routes/auth/authRoute');
const taskRoute = require('./routes/taskRoute');
const groupRoute = require('./routes/groupRoute');
const sprintRoute = require('./routes/sprintRoute');
const userProfile = require('./routes/sprintRoute');


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


// A simple test route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.use('/auth', authRoute);
app.use('/tasks', taskRoute);
app.use('/profiles', profileRoute);
app.use('/groups', groupRoute);
app.use('/sprints', sprintRoute);

app.use(express.static(path.join(__dirname, '../frontend')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



