
// We only need the group id as user has already been created
// Queryselector for the group name
const groupId = document.querySelector('#groupId');

// Button
const joinButton = document.querySelector('#joinButton');

// Button click event
joinButton.addEventListener("click", async function(){

// We retrieve value of whatever groupId and Button contain
// Define these values, such we can store it in a newly object

const id = groupId.value;

// Object
const groupData = {
groupCode: id
};

// Now we send the data to Node.js server

try {
    const response = await fetch('http://localhost:3000/groupJoin',{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({groupCode: id}) // This is the body we send
    });
    const data = await response.json();

} catch(error){
    console.error("Group not found")
}

});
