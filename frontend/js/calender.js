//Gets the current date, month and year
const currentDate = new Date();
let displayYear = currentDate.getFullYear();
let displayMonth = currentDate.getMonth();

//Gets every month in a array to be more easily displayed
const months = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

//Renders the calender in the current month and year
renderCalendar(displayYear, displayMonth);

addEventListenerToButtons();

function renderCalendar(year, month) {
  //Gets which week day, the first day in the month lands on
  //Also changes it so sunday = 6 and not 0.
  const firstDay = ((new Date(year, month, 1)
    .getDay()) + 6) % 7;

  //Gets the amount of days in the month
  //This works since day 0 gives you the last day of the last month
  const daysInMonth = new Date(year, month + 1, 0)
    .getDate();

  let calenderHTML = '';

  //Display the current month and year
  document.querySelector('#current-year-month')
    .innerHTML = `${months[month]} ${year}`;

  //Creates empty div's before the first day comes
  for (let i = 0; i < firstDay; i++) {
    calenderHTML += '<div class="calendar-day-empty"></div>';
  }
  //Creates a div with a given date in the month
  for (let i = 1; i <= daysInMonth; i++) {

    // Generates all the days in the given month and gives each an id
    calenderHTML += `<div class="calendar-day"
      id="${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">
      <p class="DateNumber">${i}</p></div>`;
  }
  //Adds the HTML to the page
  document.querySelector('#calendarGrid')
    .innerHTML = calenderHTML;

  // Runs the functions for the highlights and the task list
  renderSprintHighlights();
  renderTaskList();
  highlightToday();
}

function highlightToday() {
  //Gets the Id for the current day
  const todayId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1)
    .padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  //Checks if any of the elements matches the Id and highlights it
  const todayCell = document.getElementById(todayId);
  if (todayCell) todayCell.classList.add('current-day');
}

//Makes the sprint due date highlight, and the days up to it or after it highlight.
function renderSprintHighlights() {
  fetch('http://localhost:3000/sprints/sprints')
  .then(res => res.json())
  .then(sprints => {

    // Gets the active sprint, and returns if none is found
    const activeSprint = sprints.find(sprint => sprint.status === 'active');
    if (!activeSprint) return;

    const dueDate = document.getElementById(activeSprint.dueDate);

    // Sees if the current due date for the sprint is one the page and highligts it
    if (dueDate) {
      dueDate.classList.add('sprint-due');
      dueDate.innerHTML += `<p class="sprint-label">${activeSprint.title}</p>`;
    }

    const sprintDueDate = new Date(activeSprint.dueDate);
    const today = new Date();


    //Highlights the other days either red or green
    //Depending on if you are over or under the due date
    document.querySelectorAll('.calendar-day')
      .forEach(day => {
        const cellDate = new Date(day.id);

        if (sprintDueDate < today && cellDate >= sprintDueDate && cellDate <= today) {
          day.classList.add('sprint-overdue-range');
        } else if (cellDate > today && cellDate < sprintDueDate) {
          day.classList.add('sprint-range');
        }
      });
  })
  .catch(err => console.error('Failed to load sprint highlights:', err));
}

//Renders the current tasks and who is assigned to them
function renderTaskList() {
  fetch('http://localhost:3000/sprints/sprint-tasks')
  .then(res => res.json())
  .then(sprintsTasks => {
    document.querySelector('#js-task-amount')
      .innerHTML = sprintsTasks.length;

    let tasksHTML = '';

    sprintsTasks.forEach(task => {
      tasksHTML += `<li>${task.title} - ${task.assignedTo ?? 'unassigned'}</li>`;
    });

    document.querySelector('#js-remaning-tasks')
      .innerHTML = tasksHTML;

  })
  .catch(err => console.error('Failed to load sprint tasks:', err));
}


function addEventListenerToButtons() {
  document.querySelector('#back-button')
    .addEventListener('click', () => {
      backButton();
  });

  document.querySelector('#next-button')
    .addEventListener('click', () => {
      nextButton();
  });
}

//Makes the the calender go one month back
function backButton() {
  if (displayMonth === 0) {
    displayMonth = 11;
    displayYear--;
  } else {
    displayMonth--;
  }
  renderCalendar(displayYear, displayMonth);
}

//Makes the calender go one month forward
function nextButton() {
  if (displayMonth === 11) {
    displayMonth = 0;
    displayYear++;
  } else {
  displayMonth++;
  }
  renderCalendar(displayYear, displayMonth);
}