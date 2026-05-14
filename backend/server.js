// import all the needed libraries
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const multer = require('multer');
const pdfParse = require('pdf-parse-fork');

// Route auth imports 
const authRoute = require('./routes/auth/authRoute');

// Route imports
const taskRoute = require('./routes/taskRoute');
const groupRoute = require('./routes/groupRoute');
const sprintRoute = require('./routes/sprintRoute');
const userProfile = require('./routes/userProfile');
const competenceList = require('./routes/competenceRoute');


//Creates instance of express application
const app = express();
// Port number server will listen on
const PORT = 3000;


// File upload handler with uploaded files being stored in RAM with 20MB limit
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });


// Makes sure it can always find a specific file
// no matter where the server was launched from
const dataPath = (file) => path.join(__dirname, 'json', file);

// Middleware
// Enables cors to allow frontend to make request to backend even if not on same port
app.use(cors());
// Parses request bodies as JSON
app.use(express.json());
// Looks in the frontend folder for file with name matching _dirname, and if yes it sends it directly
app.use(express.static(path.join(__dirname, '../frontend')));
//  Parses cookies from incoming requests
app.use(cookieParser());

// In memory hashmap storage for active sessions
const sessions = new Map();

// All route uses
app.use('/auth', authRoute);
// Protected ones
app.use('/tasks', taskRoute);
app.use('/groups', groupRoute);
app.use('/sprints', sprintRoute);
app.use('/profiles', userProfile);
app.use('/competences', competenceList);


// Simple check to see that server is running if you visit localhost:3000
app.get('/', (req, res) => {
    res.send('Server is running!');
});

//start server on port which is given by PORT and console logs confirmation.
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
     console.log('Using Groq API for AI features');
});