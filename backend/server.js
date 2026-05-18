<<<<<<< HEAD
// import all the needed libraries
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

// Route auth imports 
const authRoute = require('./routes/auth/authRoute');
=======
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const multer = require('multer');
const pdfParse = require('pdf-parse-fork');

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
>>>>>>> origin/Tobber

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

<<<<<<< HEAD
// All route uses
app.use('/auth', authRoute);
// Protected ones
app.use('/tasks', taskRoute);
app.use('/groups', groupRoute);
app.use('/sprints', sprintRoute);
app.use('/profiles', userProfile);
app.use('/competences', competenceList);
=======
const DB = {
    accounts: path.join(__dirname, 'accounts.json'),
    groups: path.join(__dirname, 'group.json'),
    tasks: path.join(__dirname, 'tasks.json'),
    sprints: path.join(__dirname, 'sprints.json'),
};
>>>>>>> origin/Tobber


// Simple check to see that server is running if you visit localhost:3000
app.get('/', (req, res) => {
    res.send('Server is running!');
});

<<<<<<< HEAD
//start server on port which is given by PORT and console logs confirmation.
app.listen(PORT, () => {
=======
// Signup
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
        return res.status(400).json({ message: 'Username, email, and password are required' });

    const accounts = readJSON(DB.accounts);

    if (accounts.find(a => a.email === email))
        return res.status(400).json({ message: 'An account with this email already exists' });

    if (accounts.find(a => a.username === username))
        return res.status(400).json({ message: 'This username is already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    accounts.push({ username, email, password: hashedPassword });
    fs.writeFileSync(DB.accounts, JSON.stringify(accounts, null, 2));

    res.json({ message: 'Account created successfully!' });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });

    const accounts = readJSON(DB.accounts);
    const user = accounts.find(a => a.email === email);

    if (!user)
        return res.status(400).json({ message: 'Invalid email or password' });

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches)
        return res.status(400).json({ message: 'Invalid email or password' });

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, user.username);
    res.cookie('sessionId', sessionId);

    res.json({ message: 'Login successful! Welcome back.', username: user.username });
});

// Get all groups a user is a member of
app.get('/user/:username/groups', (req, res) => {
    const { username } = req.params;
    const groups = readJSON(DB.groups);
    const userGroups = groups
        .filter(g => g.members.includes(username))
        .map(g => ({ name: g.name, groupCode: g.groupCode, programme: g.programme, semester: g.semester }));
    res.json({ groups: userGroups });
});

// Get group info
app.get('/group/:groupCode', (req, res) => {
    const { groupCode } = req.params;
    const groups = readJSON(DB.groups);
    const group = groups.find(g => g.groupCode === groupCode);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json({
        name: group.name,
        groupCode: group.groupCode,
        programme: group.programme,
        semester: group.semester,
        members: group.members,
        hasCompetences: !!group.competences
    });
});

// Get competences for a group
app.get('/group/:groupCode/competences', (req, res) => {
    const { groupCode } = req.params;
    const groups = readJSON(DB.groups);
    const group = groups.find(g => g.groupCode === groupCode);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.competences)
        return res.status(202).json({ message: 'Competences are still being generated, try again shortly' });

    res.json({ competences: group.competences.map(c => c.name) });
});

// Save a member's competence profile answers
app.post('/group/:groupCode/member-profile', (req, res) => {
    const { groupCode } = req.params;
    const { username, answers } = req.body;

    if (!username || !answers)
        return res.status(400).json({ message: 'Username and answers are required' });

    const groups = readJSON(DB.groups);
    const idx = groups.findIndex(g => g.groupCode === groupCode);

    if (idx === -1) return res.status(404).json({ message: 'Group not found' });

    if (!groups[idx].memberProfiles) groups[idx].memberProfiles = [];

    const existing = groups[idx].memberProfiles.findIndex(p => p.username === username);
    if (existing !== -1) {
        groups[idx].memberProfiles[existing] = { username, answers };
    } else {
        groups[idx].memberProfiles.push({ username, answers });
    }

    fs.writeFileSync(DB.groups, JSON.stringify(groups, null, 2));
    res.json({ message: 'Profile saved' });
});

// Create group
app.post('/groupCreate', upload.single('curriculumFile'), async (req, res) => {
    const { name, groupCode, username, programme, semester, curriculumUrl } = req.body;

    if (!name || !groupCode || !username || !programme || !semester)
        return res.status(400).json({ message: 'Name, group ID, username, programme, and semester are required' });

    if (!curriculumUrl && !req.file)
        return res.status(400).json({ message: 'Please provide a curriculum URL or upload a PDF file' });

    const existingGroups = readJSON(DB.groups);
    if (existingGroups.find(g => g.groupCode === groupCode))
        return res.status(400).json({ message: `Group ID "${groupCode}" is already taken` });

    const newGroup = {
        name,
        groupCode,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        members: [username],
        programme,
        semester: parseInt(semester),
        curriculumUrl: curriculumUrl || null,
        competences: null
    };

    existingGroups.push(newGroup);
    fs.writeFileSync(DB.groups, JSON.stringify(existingGroups, null, 2));

    res.json({ message: 'Group created successfully!', group: newGroup });
    // Generate competences in the background
    try {
        const { getCompetenceProfile } = await import('./curriculumProfiler.mjs');
        let extractedText = null;
        if (req.file) {
            console.log('Extracting text from uploaded PDF...');
            const pdfData = await pdfParse(req.file.buffer);
            extractedText = pdfData.text;
            console.log(`Extracted ${extractedText.length} characters from PDF`);
        }

        const profile = await getCompetenceProfile(programme, parseInt(semester), curriculumUrl || null, extractedText);

        const saved = readJSON(DB.groups);
        const idx = saved.findIndex(g => g.id === newGroup.id);
        if (idx !== -1) {
            saved[idx].competences = profile.competences;
            fs.writeFileSync(DB.groups, JSON.stringify(saved, null, 2));
            console.log(`Competences saved for group "${name}"`);
        }
    } catch (err) {
        console.error('Failed to generate competences:', err.message);
        if (err.cause) console.error('Caused by:', err.cause);
    }
});

// Join group
app.post('/groupJoin', (req, res) => {
    const { groupCode, username } = req.body;

    if (!groupCode || !username)
        return res.status(400).json({ message: 'Group ID and username are required' });

    const groups = readJSON(DB.groups);
    const idx = groups.findIndex(g => g.groupCode === groupCode);

    if (idx === -1) return res.status(404).json({ message: 'Group not found' });

    if (!groups[idx].members.includes(username)) {
        groups[idx].members.push(username);
        fs.writeFileSync(DB.groups, JSON.stringify(groups, null, 2));
    }

    res.json({ message: 'Joined group successfully', groupCode });
});

// Create new task
app.post('/newtask', (req, res) => {
    const { group, title, description, quantity, duedate, oriented, createdBy } = req.body;

    if (!title || !duedate || !createdBy)
        return res.status(400).json({ message: 'Title, due date, and creator are required' });

    const tasks = readJSON(DB.tasks);

    const sprints = readJSON(DB.sprints);
    let currentSprintId = null;
    if (sprints.length > 0) {
        currentSprintId = sprints[sprints.length - 1].id;
    }

    const newTask = {
        id: Date.now(),
        groupId: group,
        title,
        description,
        quantity: parseInt(quantity) || 1,
        duedate,
        oriented,
        createdBy,
        sprintId: currentSprintId,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    fs.writeFileSync(DB.tasks, JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task created successfully!', task: newTask });
});

//Gets all the current sprints
app.get('/sprints', (req, res) => {
    const sprints = readJSON(DB.sprints);
    res.json(sprints);
});

//Gets the tasks in a sprint
app.get('/sprint-tasks', (req, res) => {
    const sprints = readJSON(DB.sprints);
    const tasks = readJSON(DB.tasks);

    if (sprints.length === 0) {
        return res.json([]);
    }

    const newestSprint = sprints[sprints.length - 1];

    let sprintTasks = [];

    tasks.forEach(task => {
        if (task.sprintId === newestSprint.id && task.status === 'accepted') {
            sprintTasks.push(task);
        }
    });

    res.json(sprintTasks);
});

//Gets pending tasks
app.get('/pending-tasks', (req, res) => {
    const tasks = readJSON(DB.tasks);

    let pendingTasks = [];

    tasks.forEach(task => {
        if (task.status === 'pending') {
            pendingTasks.push(task);
        }
    });

    res.json(pendingTasks);
});

//Changes a task status to accepted.
app.post('/task-accept', (req, res) => {
    const { id } = req.body;
    const tasks = readJSON(DB.tasks);

    //Changes the task status for the task with the same ID
    tasks.forEach(task => {
        if (task.id === id) {
            task.status = 'accepted';
        }
    });
    //Updates the server memeory
    fs.writeFileSync(DB.tasks, JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task accepted' });
});

//Rejects a task and removes it
app.post('/task-reject', (req, res) => {
    const { id } = req.body;
    let  tasks = readJSON(DB.tasks);

    //Filters away the task with the same ID
    tasks = tasks.filter(task => task.id !== id)

    //Updates the server memeory
    fs.writeFileSync(DB.tasks, JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task removed' });
});



//Creates a new sprint
app.post('/newsprint', (req, res) => {
    const { title, description, enddate } = req.body;
    const sprints = readJSON(DB.sprints);

    const newSprint = {
        id: Date.now(),
        title,
        description,
        enddate,
        createdAt: new Date().toISOString()
    };

    sprints.push(newSprint);
    fs.writeFileSync(DB.sprints, JSON.stringify(sprints, null, 2));

    res.json({ message: 'Sprint created!', sprint: newSprint });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(PORT, async () => {
>>>>>>> origin/Tobber
    console.log(`Server running at http://localhost:${PORT}`);
     console.log('Using Groq API for AI features');
});