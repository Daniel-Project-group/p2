

// FUll object
/*[
  {
    "username": "anton",
    "groupCode": "ABC123",
    "education": "Computer Science",
    "semester": 2,
    "ratings": [
      { "competence": "JavaScript", "score": 8 },
      { "competence": "Algorithms", "score": 6 }
    ]
  }
] */


// Imports
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);


// Post route
router.post('/user-profile', async (req, res) => {
    const { competence, proficiency, interest } = req.body;

    if (!competence || !proficiency || !interest) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    let competences = [];
    if (fs.existsSync(dataPath('profile.json'))) {
        const data = fs.readFileSync(dataPath('competences.json'), 'utf-8');
        competences = JSON.parse(data);
    }


    // Save to file
    fs.writeFileSync(dataPath('profile.json'), JSON.stringify(competences, null, 2));

    res.json({ message: 'Skill profile, logged succesfully!' });
});

// Not finished at all - implement cookies before doing anything

module.exports = router;
