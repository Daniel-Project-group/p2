
// Imports
const express = require("express");


// Helper function
const { readJson, writeJson } = require("../utils/jsonDb");

const router = express.Router();

// GET route to get competences for a group
router.get('/group/:groupCode/competences', (req, res) => {
    //destruct object to extract groupCode from req.params
    const { groupCode } = req.params;
    // Helper function
    const groups = readJson("group.json");

    //save group that has a matching groupCode to the one from req
    const groupFind = groups.find(g => g.groupCode === groupCode);

    //if there is no such group, return 404 error that group was not found
    if (!groupFind) return res.status(404).json({ message: 'Group not found' });

    //if there is such group but it does not have competences yet return 202 (accepted but not ready), saying competences have not finished yet
    if (!groupFind.competences)
        return res.status(202).json({ message: 'Competences are still being generated, try again shortly' });

    //Return the competence names as an array, stripping out other fields
    res.json({ competences: groupFind.competences.map(c => c.name) });
});


module.exports = router;
