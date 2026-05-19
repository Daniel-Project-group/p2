// import all the needed libraries
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

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


// Middleware
// Enables cors to allow frontend to make request to backend even if not on same port
app.use(cors());
// Parses request bodies as JSON
app.use(express.json());
// Looks in the frontend folder for file with name matching _dirname, and if yes it sends it directly
app.use(express.static(path.join(__dirname, '../frontend')));
//  Parses cookies from incoming requests
app.use(cookieParser());

// In memory hashmap storage for active sessions - removed for now
//const sessions = new Map();

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
