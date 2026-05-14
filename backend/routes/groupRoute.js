

const express =require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// Creating group route
router.post('/groupCreate', (req,res) =>{
const {name,groupCode,username} = req.body;

// We validate the data
    if(!name || !groupCode || !username){
        return res.status(400).json({message: 'Name and Id required'});
    }
    // We read existing groups stored in json to add the new
    let groups = [];
    if(fs.existsSync(dataPath('group.json'))){
        const data = fs.readFileSync(dataPath('group.json'), 'utf-8');
        groups = JSON.parse(data);
    }

    // New group object
    const newGroup = {
        name: name,
        groupCode: groupCode,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        members: [username] // Upon creation the given username is stored
    }

    // We add to array

    groups.push(newGroup);

    // Save to file
    fs.writeFileSync(dataPath('group.json'), JSON.stringify(groups, null, 2)); 
    // groups is the data going to json file Null means we dont filter or transfrom 2: format with 2 spaces indentation in json file 

    res.json({ message: 'Task created successfully!', groups: newGroup });

});



// Join route

router.post('/groupJoin', (req,res) => {
    const{groupCode} = req.body;
    
// Now the group ids in json is read

    let groups = [];
    if(fs.existsSync(dataPath('group.json'))){
        const data = fs.readFileSync(dataPath('group.json'), 'utf-8');
        groups = JSON.parse(data);
    }

    // We need a const/variable for when whatever input from frontend matches whats in group.json
    const matchingGroup = groups.find(function(group){
        return group.groupCode === groupCode;
    })
    if(matchingGroup){
        // Assignment due:
        // Here the user needs to be stored in the given groups member property array
    }
});

module.exports = router;

