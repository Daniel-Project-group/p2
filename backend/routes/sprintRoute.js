

// Imports
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

//Creates a new sprint
router.post('/newsprint', (req, res) => {
    const { title, description, enddate } = req.body;
    let sprints = [];
    if (fs.existsSync(dataPath('sprints.json'))) {
        sprints = JSON.parse(fs.readFileSync(dataPath('sprints.json'), 'utf-8'));
    }
    
    const newSprint = {
    id: Date.now(),
    title,
    description,
    enddate,
    createdAt: new Date().toISOString()
};

    sprints.push(newSprint);
    fs.writeFileSync(dataPath('sprints.json'), JSON.stringify(sprints, null, 2));

    res.json({ message: 'Sprint created!', sprint: newSprint });
});

//Gets all the current sprints
router.get('/sprints', (req, res) => {
    let sprints = [];
    if (fs.existsSync(dataPath('sprints.json'))) {
        sprints = JSON.parse(fs.readFileSync(dataPath('sprints.json'), 'utf-8'));
    }
    res.json(sprints);
});

// Read sprint route
router.get('/sprint-tasks', (req, res) => {
    let sprints = [];
    let tasks = [];
    if (fs.existsSync(dataPath('sprints.json'))) {
        sprints = JSON.parse(fs.readFileSync(dataPath('sprints.json'), 'utf-8'));
    }
    if (fs.existsSync(dataPath('tasks.json'))) {
        tasks = JSON.parse(fs.readFileSync(dataPath('tasks.json'), 'utf-8'));
    }

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
