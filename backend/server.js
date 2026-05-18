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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cookieParser());

const sessions = new Map();

const DB = {
    accounts: path.join(__dirname, 'accounts.json'),
    groups: path.join(__dirname, 'group.json'),
    tasks: path.join(__dirname, 'tasks.json'),
};

function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
}

app.get('/', (req, res) => {
    res.send('Server is running!');
});

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
    const { group, title, description, quantity, duedate, createdBy } = req.body;

    if (!title || !duedate || !createdBy)
        return res.status(400).json({ message: 'Title, due date, and creator are required' });

    // Find the active sprint for this group
    const sprintsFile = path.join(__dirname, 'sprints.json');
    let activeSprint = null;
    if (fs.existsSync(sprintsFile)) {
        const data = fs.readFileSync(sprintsFile, 'utf-8');
        if (data.trim()) {
            const sprints = JSON.parse(data);
            activeSprint = sprints.find(s => s.groupCode === group && s.status === 'active');
        }
    }

    if (!activeSprint) {
        return res.status(400).json({ message: 'No active sprint. Please create a sprint first.' });
    }

    const tasks = readJSON(DB.tasks);

    const newTask = {
        id: Date.now(),
        groupId: group,
        sprintId: activeSprint.id,         // Attach to active sprint
        title,
        description,
        quantity: parseInt(quantity) || 1,
        duedate,
        createdBy,
        status: 'todo',                    // Changed from 'pending' to 'todo'
        assignedTo: null,                  // assign later, with algorithm BRUH
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    fs.writeFileSync(DB.tasks, JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task created successfully!', task: newTask });
});

// Create new sprint
app.post('/createSprint', (req, res) => {
    const { groupCode, title, description, type, dueDate, createdBy } = req.body;

    // Validate required fields
    if (!groupCode || !title || !type || !dueDate || !createdBy) {
        return res.status(400).json({ message: 'Group code, title, sprint type, due date, and creator are required' });
    }

    // Check that the group exists
    const groups = readJSON(DB.groups);
    const group = groups.find(g => g.groupCode === groupCode);
    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Only the group leader (first member / creator) can create sprints
    //if (group.members[0] !== createdBy) {
    //   return res.status(403).json({ message: 'Only the group leader can create sprints' });
    //}

    // Read existing sprints
    const sprintsFile = path.join(__dirname, 'sprints.json');
    let sprints = [];
    if (fs.existsSync(sprintsFile)) {
        const data = fs.readFileSync(sprintsFile, 'utf-8');
        if (data.trim()) sprints = JSON.parse(data);
    }


    sprints.forEach(sprint => {
        if (sprint.groupCode === groupCode && sprint.status === 'active') {
            sprint.status = 'completed';
            sprint.completedAt = new Date().toISOString();
        }
    });

    // Create the new sprint
    const newSprint = {
        id: Date.now(),
        groupCode,
        title,
        description: description || '',
        type,
        dueDate,
        createdBy,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    sprints.push(newSprint);

    // Save to file
    fs.writeFileSync(sprintsFile, JSON.stringify(sprints, null, 2));

    res.json({ message: 'Sprint created successfully!', sprint: newSprint });
});

// Get the active sprint for a group
app.get('/group/:groupCode/active-sprint', (req, res) => {
    const { groupCode } = req.params;
    const sprintsFile = path.join(__dirname, 'sprints.json');

    if (!fs.existsSync(sprintsFile)) {
        return res.json({ sprint: null });
    }

    const data = fs.readFileSync(sprintsFile, 'utf-8');
    if (!data.trim()) return res.json({ sprint: null });

    const sprints = JSON.parse(data);
    const activeSprint = sprints.find(s => s.groupCode === groupCode && s.status === 'active');

    res.json({ sprint: activeSprint || null });
});

// Get all tasks for a specific sprint
app.get('/sprint/:sprintId/tasks', (req, res) => {
    const { sprintId } = req.params;

    const tasks = readJSON(DB.tasks);
    const sprintTasks = tasks.filter(task => task.sprintId === parseInt(sprintId));

    res.json({ tasks: sprintTasks });
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Using Groq API for AI features');
});