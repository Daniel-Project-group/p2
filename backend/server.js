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

//Creates instance of express application
const app = express();
// Port number server will listen on
const PORT = 3000;

// File upload handler with uploaded files being stored in RAM with 20MB limit
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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

// Object that holds file path for the three JSON "databases"
const DB = {
    accounts: path.join(__dirname, 'accounts.json'),
    groups: path.join(__dirname, 'group.json'),
    tasks: path.join(__dirname, 'tasks.json'),
};

// Helper function that takes file path as argument
function readJSON(file) {
    // If file does not exist return empty array
    if (!fs.existsSync(file)) return [];
    // Read the file as string with utf-8 encoding
    const data = fs.readFileSync(file, 'utf-8');
    // trim data to remove whitespaces, parse it as JSON and return, or return empty array if file was empty
    // This is because JSON.parse crasher if data is empty 
    return data.trim() ? JSON.parse(data) : [];
}

// Simple check to see that server is running if you visit localhost:3000
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Signup post route that is asynchronious due to waiting for hashing of password
app.post('/signup', async (req, res) => {
    //object destruct to extract username, email and password from req.body
    const { username, email, password } = req.body;

    //If there missing any of the fields, return a 400 (bad request) error with message saying all three are required
    if (!username || !email || !password)
        return res.status(400).json({ message: 'Username, email, and password are required' });

    //Load list of current accounts from DB.accounts
    const accounts = readJSON(DB.accounts);

    //If there is an account with same mail, return error 400 saying there is already account with this mail
    if (accounts.find(a => a.email === email))
        return res.status(400).json({ message: 'An account with this email already exists' });

    //If there is an account with same username, return error 400 saying there is already account with this username
    if (accounts.find(a => a.username === username))
        return res.status(400).json({ message: 'This username is already taken' });

    //await hashed password using bcrypt.hash with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Push account to accounts array using hashedPassword as password
    accounts.push({ username, email, password: hashedPassword });
    //Write updated account arrray back to the file with 2 space indentation
    fs.writeFileSync(DB.accounts, JSON.stringify(accounts, null, 2));

    // Send a succes response that account was created succesfully
    res.json({ message: 'Account created successfully!' });
});

// Login route 
app.post('/login', async (req, res) => {
    //Destruct object to extract email and password
    const { email, password } = req.body;

    //Check to make sure email and password are not empty
    if (!email || !password)
        //Write 400 error message if they are empty saying they are required
        return res.status(400).json({ message: 'Email and password are required' });

    //Load list of current accounts from DB.accounts
    const accounts = readJSON(DB.accounts);
    //Find user in accounts with mail matching to one from req.body
    const user = accounts.find(a => a.email === email);

    //If there is no such user, then email or password must be invalid. This is deliberately vague so attackers don't know which went wrong
    if (!user)
        return res.status(400).json({ message: 'Invalid email or password' });

    // Compare hash of password from the req.body with saved hash version. If original password is the same, they should hash to same value
    const passwordMatches = await bcrypt.compare(password, user.password);

    //If they do not hash to same value
    if (!passwordMatches)
        //Return 400 error message saying again that email or passwords is invalid, to be delibaretly vague
        return res.status(400).json({ message: 'Invalid email or password' });

    //Generates a random user ID for this session
    const sessionId = crypto.randomUUID();
    //Stores a mapping from sessionId to username
    sessions.set(sessionId, user.username);
    // Sends the sessionID to browser as cookie, so it can be sent back with future requests
    res.cookie('sessionId', sessionId);

    // Sends succes response including username so frontend knows who logged in
    res.json({ message: 'Login successful! Welcome back.', username: user.username });
});

// GET route to fetch all groups a user belongs to. :username is an URL parameter here, so if user was Orwell then that would be put instead of :username
app.get('/user/:username/groups', (req, res) => {
    // Extracts username from URL parameters
    const { username } = req.params;
    // Loads all groups from group.json
    const groups = readJSON(DB.groups);
    // Filter only to groups where their member arrray contain username
    const userGroups = groups
        .filter(g => g.members.includes(username))
        // Transform each group object to include only field frontend needs, to strip out sensitive info such as competences/member profiles.
        .map(g => ({ name: g.name, groupCode: g.groupCode, programme: g.programme, semester: g.semester }));
    // Send the filtered list back as JSON response
    res.json({ groups: userGroups });
});


//GET route for a specific group
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

// GET route to get competences for a group
app.get('/group/:groupCode/competences', (req, res) => {
    //destruct object to extract groupCode from req.params
    const { groupCode } = req.params;
    //read group.json to load groups
    const groups = readJSON(DB.groups);
    //save group that has a matching groupCode to the one from req
    const group = groups.find(g => g.groupCode === groupCode);

    //if there is no such group, return 404 error that group was not found
    if (!group) return res.status(404).json({ message: 'Group not found' });

    //if there is such group but it does not have competences yet return 202 (accepted but not ready), saying competences have not finished yet
    if (!group.competences)
        return res.status(202).json({ message: 'Competences are still being generated, try again shortly' });

    //Return the competence names as an array, stripping out other fields
    res.json({ competences: group.competences.map(c => c.name) });
});

// POST Route to save a member's competence profile answers
app.post('/group/:groupCode/member-profile', (req, res) => {
    //destruct object to extract groupCode from req.params
    const { groupCode } = req.params;
    //destruct object to extract username and answers from req.body
    const { username, answers } = req.body;

    //check if username and answers are not empty, if they are send 400 error saying they are required
    if (!username || !answers)
        return res.status(400).json({ message: 'Username and answers are required' });

    //read group.json to load groups
    const groups = readJSON(DB.groups);
    //save index of group that has a matching groupCode to the one from req
    const idx = groups.findIndex(g => g.groupCode === groupCode);

    //index of that group is -1 send 404 error group not found
    if (idx === -1) return res.status(404).json({ message: 'Group not found' });

    //If the memberProfiles of the group are empty, set them to empty array
    if (!groups[idx].memberProfiles) groups[idx].memberProfiles = [];

    //check if there is member in the group with a competence profile and save index in existing 
    const existing = groups[idx].memberProfiles.findIndex(p => p.username === username);
    // If index is not -1 there was such user
    if (existing !== -1) {
        // In that case replace his old profile with new
        groups[idx].memberProfiles[existing] = { username, answers };
    } else {
        // else create a competence profile for user
        groups[idx].memberProfiles.push({ username, answers });
    }

    //Write updated group arrray back to the file with 2 space indentation
    fs.writeFileSync(DB.groups, JSON.stringify(groups, null, 2));
    // send response saying profile saved
    res.json({ message: 'Profile saved' });
});

// POST route to Create group, where upload.single('curriculumFile') is some middleware that proceses a singlefile with name curriculumFile before route handler runs
app.post('/groupCreate', upload.single('curriculumFile'), async (req, res) => {

    //destruct object to extract name, groupCode, username, programme, semester and curriculumUrl from req.body
    const { name, groupCode, username, programme, semester, curriculumUrl } = req.body;

    //Validate that these are not empty, if they are, send error 400 saying they are required
    if (!name || !groupCode || !username || !programme || !semester)
        return res.status(400).json({ message: 'Name, group ID, username, programme, and semester are required' });

    //Also check that curriculumUrl and req.file are not empty, and if they are send 400 error message saying that atleast one of the two must be provided
    if (!curriculumUrl && !req.file)
        return res.status(400).json({ message: 'Please provide a curriculum URL or upload a PDF file' });

    //read current groups from group.json
    const existingGroups = readJSON(DB.groups);
    //check if there is an existing group matching groupcode
    if (existingGroups.find(g => g.groupCode === groupCode)) {
        //if there is, send 400 error that groupCode is already taken
        return res.status(400).json({ message: `Group ID "${groupCode}" is already taken` });
    }

    //If group was not already taken, create a new group object using Date.now() as ID, which gives an unique numeric ID
    //Here competences are also set to null, as not generated yet
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

    //push newGroup to existingGroups array
    existingGroups.push(newGroup);
    //Write updated group arrray back to the file with 2 space indentation. Important to note this is done before competence generation, as LLM can take time.
    fs.writeFileSync(DB.groups, JSON.stringify(existingGroups, null, 2));

    //Send response that groups were created succesfully together with the new group
    res.json({ message: 'Group created successfully!', group: newGroup });
    // Generate the competences in the background
    try {
        // Asynchroniously import curriculumProfiler, and destruct object to extract getCompetenceProfile
        const { getCompetenceProfile } = await import('./curriculumProfiler.mjs');
        //create variable for extractedText
        let extractedText = null;
        //If the PDF was uploaded
        if (req.file) {
            console.log('Extracting text from uploaded PDF...');
            //Extract text from pdf using pdfParse with req.file.buffer to guide how much of it to parse
            const pdfData = await pdfParse(req.file.buffer);
            // save the text of pdfData in extractedText variable
            extractedText = pdfData.text;
            console.log(`Extracted ${extractedText.length} characters from PDF`);
        }

        //Asynchroniously call LLLM pipeline with either text or semester and curriculumUrl combination, then store competences in profile
        const profile = await getCompetenceProfile(programme, parseInt(semester), curriculumUrl || null, extractedText);

        // Re-read group.json before writing. This is smart as other requests might have modified while LLM was running.
        const currentGroups = readJSON(DB.groups);
        // save index where the id matches the id of the new group
        const idx = currentGroups.findIndex(g => g.id === newGroup.id);
        // If there is such an index
        if (idx !== -1) {
            // Save the newly generated competences as the competences of the group
            currentGroups[idx].competences = profile.competences;
            // Write the groups now with the updated competences back to the file in JSON format
            fs.writeFileSync(DB.groups, JSON.stringify(currentGroups, null, 2));
            console.log(`Competences saved for group "${name}"`);
        }
        // If anything goes wrong n generating competence log it but don't crash
    } catch (err) {
        console.error('Failed to generate competences:', err.message);
        if (err.cause) console.error('Caused by:', err.cause);
    }
});

// POST route for joining a group
app.post('/groupJoin', (req, res) => {
    //Destruct object to extract groupCode and username from req.body
    const { groupCode, username } = req.body;

    //If they are empty send 400 error saying required
    if (!groupCode || !username)
        return res.status(400).json({ message: 'Group ID and username are required' });

    // read group.json and save groups
    const groups = readJSON(DB.groups);
    // find group with matching index of groupCode from req.body and save its index in idx
    const idx = groups.findIndex(g => g.groupCode === groupCode);

    // if index was -1 send 404 error saying group not found
    if (idx === -1) return res.status(404).json({ message: 'Group not found' });

    // if the group at index exists but does not include username from req.body
    if (!groups[idx].members.includes(username)) {
        // push username to group at idx members array
        groups[idx].members.push(username);
        // write the updated groups array in JSON format to file
        fs.writeFileSync(DB.groups, JSON.stringify(groups, null, 2));
    }

    // send response that user joined groupsuccesfully together with groupcode
    res.json({ message: 'Joined group successfully', groupCode });
});

// POST route to create new task
app.post('/newtask', (req, res) => {
    //Destruct object to extract group, title, description, quantity, duedate, oriented and createdBy from req.body
    const { group, title, description, quantity, duedate, oriented, createdBy } = req.body;

    //if title, duedate, oriented or createdBy is empty, send 400 error saying required
    if (!title || !duedate || !oriented || !createdBy)
        return res.status(400).json({ message: 'Title, due date, task type, and creator are required' });

    //read tasks.json and save in tasks
    const tasks = readJSON(DB.tasks);

    //create newTask object, where quantity is amount of members on task and oriented is distribution mode. If quantity cannot be parsed default to 1.
    const newTask = {
        id: Date.now(),
        groupId: group,
        title,
        description,
        quantity: parseInt(quantity) || 1,
        duedate,
        oriented,
        createdBy,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    //Push task to tasks array
    tasks.push(newTask);
    //Write updated tasks in JSON format to file
    fs.writeFileSync(DB.tasks, JSON.stringify(tasks, null, 2));

    // send response that task was created succesfully along with task
    res.json({ message: 'Task created successfully!', task: newTask });
});

//start server on port which is given by PORT and console logs confirmation.
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Using Groq API for AI features');
});