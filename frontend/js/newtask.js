// Find the form
const taskForm = document.getElementById('taskForm');

let tasks = [];

let groupCount = 0;

let currentQuantity = 0;

// Read user identity once from localStorage so every function on the page can use it
const username = localStorage.getItem('username');
const groupCode = localStorage.getItem('groupCode');

taskForm.addEventListener('submit', async function (event) {
  // Stop the form from doing the default thing
  event.preventDefault();

  // Bail out if not logged in or no group selected
  if (!username) {
    alert('You need to be logged in to create a task');
    window.location.href = 'signin.html';
    return;
  }

  if (!groupCode) {
    alert('No group selected. Please select a group first.');
    window.location.href = 'PreHomePage.html';
    return;
  }

  // Get all the values from the form
  const title = document.getElementById('TaskTitle').value;
  const description = document.getElementById('TaskDescription').value;
  const quantity = document.getElementById('Quantity').value;

  //Checks if the tasks has a title
  if (!title.trim()) {
    alert('Please enter a task title');
    return;
}

  const currentTask = {
    taskId: Date.now(),
    title,
    description,
    quantity,
  }
  //Pushes the new task into the array
  tasks.push(currentTask);

  renderHTML();

  //Resets the form
  taskForm.reset();


});

//Finds the amount of group members in the users group
fetch(`http://localhost:3000/groups/user/${username}/groups`)
  .then(res => res.json())
  .then(data => {
    const group = data.groups.find(g => g.groupCode === groupCode);
    if (group) groupCount = group.members.length;
  });

addEventToX();
addEventToQuantity();

function renderHTML() {

  let taskHTML = ``;

  tasks.forEach(task => {

    taskHTML += `
    <div class="TaskCard" data-task-id="${task.taskId}">
      <button class="TaskCardRemove" aria-label="Remove task">x</button>
      <h4 class="TaskCardTitle">${task.title}</h4>
      <p class="TaskCardDescription">${task.description}</p>
      <label class="TaskCardQuantity">
        <input type="number" class="TaskCardQuantityInput" value="${task.quantity}" min="1" max="20">
        <span>people</span>
      </label>
    </div>
    `
  });

  document.querySelector('#taskGrid').innerHTML = taskHTML;

}

function addEventToX() {
  document.querySelector('#taskGrid').addEventListener('click', (e) => {

  // Returns if x was not clicked
  if (!e.target.classList.contains('TaskCardRemove')) return;
  
  //Finds the clost TaskCard class to the x
  const card = e.target.closest('.TaskCard');

  //Gets the taskId from the class
  const taskId = Number(card.dataset.taskId);

  // Removes that task from the array, then re-renders
  tasks = tasks.filter(task => task.taskId !== taskId);
  renderHTML();

  });
}

function addEventToQuantity() {
  document.querySelector('#taskGrid').addEventListener('change', (input) => {

    //Returns if Quantity was not clicked
    if (!input.target.classList.contains('TaskCardQuantityInput')) return;

     //Finds the clost TaskCard class to the quantity
    const card = input.target.closest('.TaskCard');

    //Gets the task id from the class
    const currentTaskId = Number(card.dataset.taskId);

    tasks.forEach(task => {
      if (task.taskId === currentTaskId) {
        task.quantity = Number(input.target.value);
      }
    });
  });
}

function updateDelegateButton() {

}

// Send to server
async function sendToServer() {
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
