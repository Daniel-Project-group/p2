

// Imports
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// GET route to get competences for a group
router.get('/group/:groupCode/competences', (req, res) => {
    //destruct object to extract groupCode from req.params
    const { groupCode } = req.params;
    //read group.json to load groups
    let groups = [];

        if (fs.existsSync(dataPath("group.json"))) {
            const data = fs.readFileSync(dataPath("group.json"), "utf-8");
            groups = data.trim() ? JSON.parse(data) : [];
}
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


module.exports = router;
