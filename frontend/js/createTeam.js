
// Queryselector for the group name
const groupName = document.querySelector('#groupName');

// For group id
const groupId = document.querySelector('#groupId');

// Button
const groupButton = document.querySelector('#createGroupButton');

// Semester
const groupSemester = document.querySelector('#semester')

// Degree
const groupDegree = dovument.querySelector('#degree')

// Now we make the function for when clicken the button
// On the event we want to store whatever groupName and groupId contains

groupButton.addEventListener("click", async function(){

// We retrieve value of whatever groupId and Button contain
// Define these values, such we can store it in a newly object

const group = groupName.value;
const id = groupId.value;

// Object
const groupData = {
name: group,
groupCode: id
};

// Now we send the data to Node.js server

try {
    const response = await fetch('http://localhost:3000/groupCreate',{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: group, groupCode: id}) // This is the body we send
    });
    const data = await response.json();

} catch(error){
    console.error("Couldn't create grop")
}

});
