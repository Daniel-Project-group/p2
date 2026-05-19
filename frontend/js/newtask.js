// Find the form
const taskForm = document.getElementById('taskForm');

let taskHTML = ``;
let tasks = [];

taskForm.addEventListener('submit', async function (event) {
  // Stop the form from doing the default thing
  event.preventDefault();

  // Get who is logged in (saved in localStorage at login)
  const username = localStorage.getItem('username');
  if (!username) {
    alert('You need to be logged in to create a task');
    window.location.href = 'signin.html';
    return;
  }

  // Get which group the user is in
  const groupCode = localStorage.getItem('groupCode');
  if (!groupCode) {
    alert('No group selected. Please select a group first.');
    window.location.href = 'PreHomePage.html';
    return;
  }

  // Get all the values from the form
  const title = document.getElementById('TaskTitle').value;
  const description = document.getElementById('TaskDescription').value;
  const quantity = document.getElementById('Quantity').value;

  const currentTask = {
    taskId: Date.now(),
    title,
    description,
    quantity,
  }
  //Pushes the new task into the array
  tasks.push(currentTask);

  //Resets the form
  taskForm.reset();

});



// Send to server
function sendToServer() {
  try {
    const response = await fetch('http://localhost:3000/tasks/newtask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        description: description,
        quantity: quantity,
        group: groupCode
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Task created successfully!');
      window.location.href = 'HomePage.html';
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert('Could not connect to the server. Is it running?');
    console.error(error);
  }
}
