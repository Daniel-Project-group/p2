// Imports
const express = require("express");

// Helper function
const { readJson, writeJson } = require("../utils/jsonDb");

const router = express.Router();

//Creates a new sprint
router.post('/newsprint', (req, res) => {
    // Accept both dueDate (new form) and enddate (legacy form) for the deadline
    const { groupCode, title, description, type, dueDate, enddate, createdBy } = req.body;
    const deadline = dueDate || enddate;

    if (!groupCode || !title || !createdBy) {
        return res.status(400).json({ message: 'Group code, title, and creator are required' });
    }

    // Helper function reading sprints from json
    const sprints = readJson("sprints.json");

    // Mark any existing active sprint for this group as completed
    sprints.forEach(s => {
        if (s.groupCode === groupCode && s.status === 'active') {
            s.status = 'completed';
            s.completedAt = new Date().toISOString();
        }
    });

    const newSprint = {
        id: Date.now(),
        groupCode,
        title,
        description: description || '',
        type: type || null,
        dueDate: deadline,
        createdBy,
        status: 'active',
        tasks: []
    };

    sprints.push(newSprint);
    writeJson("sprints.json", sprints);

    res.json({ message: 'Sprint created!', sprint: newSprint });
});

//Gets current sprint
router.get('/sprints', (req, res) => {
    const sprints = readJson("sprints.json");
    res.json(sprints);
});

// Read sprint route
router.get('/sprint-tasks', (req, res) => {

    const sprint = readJson("sprints.json");
    res.json(sprint.tasks);

});



//Creates a POST route for assigning tasks
router.post('/sprints/assign', async (req, res) => {
    //try catch in case there are errors
    try {
        //Import assignTasks function from matcher.js
        const { assignTasks } = require('../matcher');
        //Import relevantCompetencesForTask function from taskScorer.js
        const { relevantCompetencesForTask } = require('../taskScorer');
        // Destruct req.body to extract groupCode and mode
        const { groupCode, mode } = req.body;
        //Read from groups from group.json and parse them
        const currentGroups = readJson("group.json");
        //check if there is a group that matches the groupCode from the req body
        let groupReal = null;
        for (const group of currentGroups) {
            if (group.groupCode === groupCode) {
                groupReal = group;
            }
        }
        //If there is no such group throw 404 error that group is not found
        if (!groupReal) return res.status(404).json({ message: "Group not found" });
        //Read sprints.json and parse the tasks.
        const sprints = readJson("sprints.json");
        //Filter the sprints, and save only the ones that have groupCode variable the same as the groupCode from req body
        const activeSprint = sprints.find(s => s.groupCode === groupCode && s.status === 'active');
        //Save the tasks of that sprint
        const groupTask = activeSprint.tasks;
       
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

