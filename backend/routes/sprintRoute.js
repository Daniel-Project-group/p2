

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



//Creates a POST route for assigning tasks
router.post('/sprints/assign', async (req, res) => {
    //try catch in case there are errors
    try {
        //Import assignTasks function from matcher.js
        const { assignTasks } = require('../matcher');
        //Import relevantCompetencesForTask function from taskScorer.mjs
        const { relevantCompetencesForTask } = await import('../taskScorer.mjs');
        // Destruct req.body to extract groupCode and mode
        const { groupCode, mode } = req.body;
        //Read from groups from group.json and parse them
        const data = fs.readFileSync(dataPath("group.json"), "utf-8");
        const currentGroups = data.trim() ? JSON.parse(data) : [];
        //check if there is a group that matches the groupCode from the req body
        let groupReal = null;
        for (const group of currentGroups) {
            if (group.groupCode === groupCode) {
                groupReal = group;
            }
        }
        //If there is no such group throw 404 error that group is not found
        if (!groupReal) return res.status(404).json({ message: "Group not found" });
        //Read tasks.json and parse the tasks.
        const data1 = fs.readFileSync(dataPath("tasks.json"), "utf-8");
        const currentTasks = data1.trim() ? JSON.parse(data1) : [];
        //Filter the currentTasks, and save only the ones that have groupId variable the same as the groupCode from req body
        const groupTask = currentTasks.filter(t => t.groupId === groupCode);
        //Save the competence names of the groups competences
        const competenceNames = groupReal.competences.map(c => c.name);
        //Loop through all the tasks of the group
        for (const task of groupTask) {
            //Save all the relevant competence for the tasks in the relevantCompetences attribute of the tasks
            task.relevantCompetences = await relevantCompetencesForTask(task.title, task.description, competenceNames);
        }
        //Calculate the assignments based on tasks of the group, memberprofiles and distribution mode and save assignments array
        const assigments = assignTasks(groupTask, groupReal.memberProfiles, mode);

        //Send JSON response with the assignments array and message saying assignment is succesful
        res.json({ message: 'Tasks assigned succesfully', assigments });
    }
    //Catch clause to handle the error
    catch (err) {
        //Write error message to console
        console.error("Assignment failed", err.message);
        //Throw error with code 500 saying assignment failed together with error message
        res.status(500).json({ message: "Assigntment failed", "error": err.message });
    }

});

module.exports = router;

