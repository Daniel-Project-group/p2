

const express =require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// POST route to Create group, where upload.single('curriculumFile') is some middleware that proceses a singlefile with name curriculumFile before route handler runs
router.post('/groupCreate', upload.single('curriculumFile'), async (req, res) => {

    //destruct object to extract name, groupCode, username, programme, semester and curriculumUrl from req.body
    const { name, groupCode, username, programme, semester, curriculumUrl } = req.body;

    //Validate that these are not empty, if they are, send error 400 saying they are required
    if (!name || !groupCode || !username || !programme || !semester)
        return res.status(400).json({ message: 'Name, group ID, username, programme, and semester are required' });

    //Also check that curriculumUrl and req.file are not empty, and if they are send 400 error message saying that atleast one of the two must be provided
    if (!curriculumUrl && !req.file)
        return res.status(400).json({ message: 'Please provide a curriculum URL or upload a PDF file' });

    //read current groups from group.json
    let existingGroups = [];

    if (fs.existsSync(dataPath("group.json"))) {
        const data = fs.readFileSync(dataPath("group.json"), "utf-8");
        existingGroups = data.trim() ? JSON.parse(data) : [];
}
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
    fs.writeFileSync(dataPath("group.json"), JSON.stringify(existingGroups, null, 2));

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
        let currentGroups = [];

        if (fs.existsSync(dataPath("group.json"))) {
            const data = fs.readFileSync(dataPath("group.json"), "utf-8");
            currentGroups = data.trim() ? JSON.parse(data) : [];
}
        // save index where the id matches the id of the new group
        const idx = currentGroups.findIndex(g => g.id === newGroup.id);
        // If there is such an index
        if (idx !== -1) {
            // Save the newly generated competences as the competences of the group
            currentGroups[idx].competences = profile.competences;
            // Write the groups now with the updated competences back to the file in JSON format
            fs.writeFileSync(dataPath("group.json"), JSON.stringify(currentGroups, null, 2));
            console.log(`Competences saved for group "${name}"`);
        }
        // If anything goes wrong n generating competence log it but don't crash
    } catch (err) {
        console.error('Failed to generate competences:', err.message);
        if (err.cause) console.error('Caused by:', err.cause);
    }
});

// POST route for joining a group
router.post('/groupJoin', (req, res) => {
    //Destruct object to extract groupCode and username from req.body
    const { groupCode, username } = req.body;

    //If they are empty send 400 error saying required
    if (!groupCode || !username)
        return res.status(400).json({ message: 'Group ID and username are required' });

    // read group.json and save groups
    let groups = [];

        if (fs.existsSync(dataPath("group.json"))) {
            const data = fs.readFileSync(dataPath("group.json"), "utf-8");
            groups = data.trim() ? JSON.parse(data) : [];
}
    // find group with matching index of groupCode from req.body and save its index in idx
    const idx = groups.findIndex(g => g.groupCode === groupCode);

    // if index was -1 send 404 error saying group not found
    if (idx === -1) return res.status(404).json({ message: 'Group not found' });

    // if the group at index exists but does not include username from req.body
    if (!groups[idx].members.includes(username)) {
        // push username to group at idx members array
        groups[idx].members.push(username);
        // write the updated groups array in JSON format to file
        fs.writeFileSync(dataPath("group.json"), JSON.stringify(groups, null, 2));
    }

    // send response that user joined groupsuccesfully together with groupcode
    res.json({ message: 'Joined group successfully', groupCode });
});



module.exports = router;

