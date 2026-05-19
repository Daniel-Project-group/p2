// Imports
const express = require("express");


// Helper function
const { readJson, writeJson } = require("../utils/jsonDb");

const router = express.Router();

// Create new task route
router.post('/newtask', (req, res) => {
    const { group, title, description, quantity, duedate, createdBy } = req.body;

    // Validate required fields
    if (!title || !duedate || !createdBy) {
        return res.status(400).json({ message: 'Title, due date, and creator are required' });
    }

    // Find the active sprint for this group — new tasks must attach to one
    const sprints = readJson("sprints.json");
    const activeSprint = sprints.find(s => s.groupCode === group && s.status === 'active');

    if (!activeSprint) {
        return res.status(400).json({ message: 'No active sprint. Please create a sprint first.' });
    }

    // Read existing tasks (or start empty) --- Done with helper
    const tasks = readJson("tasks.json");

    //create newTask object, where quantity is amount of members on task. If quantity cannot be parsed default to 1.
    const newTask = {
        id: Date.now(),
        groupId: group,
        sprintId: activeSprint.id,       // Attach to active sprint
        title: title,
        description: description,
        quantity: parseInt(quantity) || 1,
        duedate: duedate,
        createdBy: createdBy,
        status: 'todo',                  // Changed from 'pending' to 'todo'
        assignedTo: null,                // assigned later by algorithm
        createdAt: new Date().toISOString()
    };

    //Push task to tasks array
    tasks.push(newTask);

    //Write updated tasks in JSON format to file ---- helper again
    writeJson("tasks.json", tasks);

    // send response that task was created succesfully along with task
    res.json({ message: 'Task created successfully!', task: newTask });
});

//export the router
module.exports = router;
