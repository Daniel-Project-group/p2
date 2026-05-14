// Imports
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);


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
    let groups = [];

        if (fs.existsSync(dataPath("group.json"))) {
            const data = fs.readFileSync(dataPath("group.json"), "utf-8");
            groups = data.trim() ? JSON.parse(data) : [];
}
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
    fs.writeFileSync(dataPath("group.json"), JSON.stringify(groups, null, 2));
    // send response saying profile saved
    res.json({ message: 'Profile saved' });
});
