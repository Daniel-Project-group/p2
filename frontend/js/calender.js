const currentDate = new Date();
let displayYear = currentDate.getFullYear();
let displayMonth = currentDate.getMonth();

const months = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

renderCalendar(displayYear, displayMonth);

addEventListenerToButtons();

function renderCalendar(year, month) {
//Gets which week day, the first day in the month lands on
//Also changes it so sunday = 6 and not 0.
const firstDay = ((new Date(year, month, 1)
  .getDay()) + 6) % 7;

//Gets the amount of days in the month
const daysInMonth = new Date(year, month + 1, 0)
  .getDate();

let calenderHTML = '';

//Set the current month
document.querySelector('#current-year-month')
  .innerHTML = `${months[month]} ${displayYear}`;

//Creates empty div's before the first day comes
for (let i = 0; i < firstDay; i++) {
  calenderHTML += '<div class="calendar-day-empty"></div>';
}
//Creates a div with a given date in the month
for (let i = 1; i <= daysInMonth; i++) {

  //Checks if its the current date, and if gives it a new class
  if (year === currentDate.getFullYear() &&
      month === currentDate.getMonth() && currentDate.getDate() === i) {

    calenderHTML += `<div class="calendar-day current-day"
      id="${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">
      <p class="DateNumber">${i}</p></div>`;
  } else {
    calenderHTML += `<div class="calendar-day"
      id="${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">
      <p class="DateNumber">${i}</p></div>`;
  }
}
//Adds the HTML to the page
document.querySelector('#calendarGrid')
  .innerHTML = calenderHTML;

changeHTMLDates(year, month);
}

function changeHTMLDates(year, month) {
  fetch('http://localhost:3000/sprints')
  .then(res => res.json())
  .then(sprints => {

    sprints.forEach(sprint => {
      const dueDate = document.getElementById(sprint.enddate);

      if (dueDate) {
        dueDate.classList.add('sprint-due');
        dueDate.innerHTML += `<p class="sprint-label">${sprint.title}</p>`;
      }

      const endDate = new Date(sprint.enddate);
      const today = new Date();


      //Highlights the other days either red or green
      //Depending on if you are over or under the due date
      document.querySelectorAll('.calendar-day')
        .forEach(day => {
          const dayDate = new Date(day.id);

          if (endDate < today && dayDate >= endDate && dayDate <= today) {
            day.classList.add('sprint-overdue-range');
          } else if (dayDate > today && dayDate < endDate) {
            day.classList.add('sprint-range');
          }
        });
    });
  });

//Adds the tasks to the display
fetch('http://localhost:3000/sprint-tasks')
  .then(res => res.json())
  .then(sprintsTasks => {
    document.querySelector('#js-task-amount')
      .innerHTML = sprintsTasks.length;

    let tasksHTML = '';

    sprintsTasks.forEach(task => {
      tasksHTML += `<li>${task.title}</li>`;
    });

    document.querySelector('#js-remaning-tasks')
      .innerHTML = tasksHTML;

  });
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

function backButton() {
  if (displayMonth === 0) {
    displayMonth = 11;
    displayYear--;
  } else {
    displayMonth--;
  }
  renderCalendar(displayYear, displayMonth);
}

function nextButton() {
  if (displayMonth === 11) {
    displayMonth = 0;
    displayYear++;
  } else {
  displayMonth++;
  }
  renderCalendar(displayYear, displayMonth);
}