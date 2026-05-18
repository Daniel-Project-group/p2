

// Imports
const express = require("express");

// Helper function
const { readJson, writeJson } = require("../utils/jsonDb");

const router = express.Router();

//Creates a new sprint
router.post('/newsprint', (req, res) => {
    const { title, description, enddate } = req.body;

    // Helper function reading sprints from json
    const sprints = readJson("sprints.json");
 
    const newSprint = {
    id: Date.now(),
    title,
    description,
    enddate,
    createdAt: new Date().toISOString()
};

    // We push the new sprint object back into array
    sprints.push(newSprint);
    // And then json with helper
    writeJson("sprints.json", sprints);

    res.json({ message: 'Sprint created!', sprint: newSprint });
});

//Gets all the current sprints
router.get('/sprints', (req, res) => {

    // Helper
    const sprints = readJson("sprints.json");
    res.json(sprints);
});

// Read sprint route
router.get('/sprint-tasks', (req, res) => {

    const sprints = readJson("sprints.json");
    const tasks = readJson("tasks.json");

    //Makes sure there are sprints in the file
    if (sprints.length === 0) {
        return res.json([]);
    }

    //Gets the latest sprint
    const newestSprint = sprints[sprints.length - 1]

    let sprintTasks = [];
    //Pushes every task with the matching sprintId 
    // to sprint tasks
    tasks.forEach(task => {
        if (task.sprintId === newestSprint.id) {
            sprintTasks.push(task);
        }
    });

    res.json(sprintTasks);

});

module.exports = router;

