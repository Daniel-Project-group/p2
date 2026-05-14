

// Imports
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// Create new task route
router.post('/newtask', (req, res) => {
    const { group, title, description, quantity, duedate, createdBy } = req.body;

    // Validate required fields
    if (!title || !duedate || !createdBy) {
        return res.status(400).json({ message: 'Title, due date, and creator are required' });
    }

    // Read existing tasks (or start empty)
    let tasks = [];
    if (fs.existsSync(dataPath('tasks.json'))) {
        const data = fs.readFileSync(dataPath('tasks.json'), 'utf-8');
        tasks = JSON.parse(data);
    }

    //Gets the current sprint ID and adds it to the task
    let currentSprintId = null;
        if (fs.existsSync(dataPath('sprints.json'))) {
            const sprints = JSON.parse(fs.readFileSync(dataPath('sprints.json'), 'utf-8'));
            //Gets the newest sprint in the file
            if (sprints.length > 0) {
                currentSprintId = sprints[sprints.length - 1].id;
            }
        }

    // Create new task object
    const newTask = {
        id: Date.now(), 
        groupId: group,                   // unique ID (timestamp)
        title: title,
        description: description,
        quantity: parseInt(quantity) || 1,
        duedate: duedate,
        createdBy: createdBy,
        sprintId: currentSprintId,
        status: 'pending',                 // for project leader to confirm later
        createdAt: new Date().toISOString()
    };

    // Add to array
    tasks.push(newTask);

    // Save to file
    fs.writeFileSync(dataPath('tasks.json'), JSON.stringify(tasks, null, 2));

    res.json({ message: 'Task created successfully!', task: newTask });
});

module.exports = router;
