

// Imports
const express = require("express");

const router = express.Router();

// Create new task route
router.post('/newtask', (req, res) => {
    const { group, title, description, quantity, duedate, createdBy } = req.body;

    // Validate required fields
    if (!title || !duedate || !createdBy) {
        return res.status(400).json({ message: 'Title, due date, and creator are required' });
    }


    const tasks = readJson("tasks.json");
    const sprints = readJson("sprints.json")

    //Gets the current sprint ID and adds it to the task
    let currentSprintId = null;
    if (fs.existsSync(dataPath('sprints.json'))) {
        if (sprints.length > 0) {
            currentSprintId = sprints[sprints.length - 1].id;
        }
    }

    //create newTask object, where quantity is amount of members on task and oriented is distribution mode. If quantity cannot be parsed default to 1.
    const newTask = {
        id: Date.now(),
        groupId: group,
        title: title,
        description: description,
        quantity: parseInt(quantity) || 1,
        duedate: duedate,
        createdBy: createdBy,
        sprintId: currentSprintId,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    //Push task to tasks array
    tasks.push(newTask);

    writeJson("tasks.json", tasks);

    // send response that task was created succesfully along with task
    res.json({ message: 'Task created successfully!', task: newTask });
});

//export the router 
module.exports = router;
