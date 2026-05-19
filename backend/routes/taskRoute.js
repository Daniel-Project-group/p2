// Imports
const express = require("express");


// Helper function
const { readJson, writeJson } = require("../utils/jsonDb");

const router = express.Router();


// Create new task route
router.post('/newtask', (req, res) => {
    const { group, title, description, quantity} = req.body;

    // Validate required fields
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    // Find the active sprint for this group — new tasks must attach to one
    const sprints = readJson("sprints.json");
    const activeSprint = sprints.find(s => s.groupCode === group && s.status === 'active');



    //create newTask object, where quantity is amount of members on task and oriented is distribution mode. If quantity cannot be parsed default to 1.
    const newTask = {
        id: Date.now(),
        groupId: group,
        sprintId: activeSprint.id,       // Attach to active sprint
        title: title,
        description: description,
        quantity: parseInt(quantity) || 1,
        status: 'pending',               // Starts pending
        assignedTo: null,                // assigned later by algorithm
    };

    //Push task to tasks array
    activeSprint.tasks.push(newTask);

    //Write updated sprint with new task in JSON format to file ---- helper again
    writeJson("sprints.json", sprints);

    // send response that task was created succesfully along with task
    res.json({ message: 'Task created successfully!', task: newTask });
});

/*
// List pending tasks for a group (suggestion inbox)
router.get('/pending-tasks', (req, res) => {
    const { group } = req.query;
    const tasks = readJson("tasks.json");
    const pending = group
        ? tasks.filter(t => t.status === 'pending' && t.groupId === group)
        : tasks.filter(t => t.status === 'pending');
    res.json(pending);
});

// Accept a pending task — promotes it into the active sprint as 'todo'
router.post('/task-accept', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Task id is required' });

    const tasks = readJson("tasks.json");
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Task not found' });

    tasks[idx].status = 'todo';
    writeJson("tasks.json", tasks);
    res.json({ message: 'Task accepted', task: tasks[idx] });
});

// Reject a pending task — removes it entirely
router.post('/task-reject', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Task id is required' });

    const tasks = readJson("tasks.json");
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Task not found' });

    const [removed] = tasks.splice(idx, 1);
    writeJson("tasks.json", tasks);
    res.json({ message: 'Task rejected', task: removed });
});
*/

//export the router
module.exports = router;
