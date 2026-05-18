const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();

//Gets which week day, the first day in the month lands on
//Also changes it so sunday = 6 and not 0.
const firstDay = ((new Date(currentYear, currentMonth, 1)
  .getDay()) + 6) % 7;

//Gets the amount of days in the month
const daysInMonth = new Date(currentYear, currentMonth + 1, 0)
  .getDate();

let calenderHTML = '';

//Creates empty div's before the first day comes
for (let i = 0; i < firstDay; i++) {
  calenderHTML += '<div class="calendar-day-empty"></div>';
}
//Creates a div with a given date in the month
for (let i = 1; i <= daysInMonth; i++) {
  //Checks if its the current date, and if gives it a new class
  if (currentDate.getDate() === i){
    calenderHTML += `<div class="calendar-day current-day"
      id="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">
      <p class="DateNumber">${i}</p></div>`;
  } else {
    calenderHTML += `<div class="calendar-day"
      id="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">
      <p class="DateNumber">${i}</p></div>`;
  }
}

//Adds the HTML to the page
document.querySelector('#calendarGrid')
  .innerHTML = calenderHTML;

fetch('http://localhost:3000/sprints/sprints')
  .then(res => res.json())
  .then(sprints => {

    sprints.forEach(sprint => {
      const dueDate = document.getElementById(sprint.enddate);
      
      if (dueDate) {
        dueDate.classList.add('sprint-due');
        dueDate.innerHTML += `<p class="sprint-label">${sprint.title}</p>`;

        const endDate = new Date(sprint.enddate);
        const today = new Date();
        
        document.querySelectorAll('.calendar-day')
          .forEach(day => {
            //Gets the current date
            const dayDate = new Date(day.id);

            /*Checks if the you are over the duedate and highlights
            the days you are overdue*/
            if (endDate < today && dayDate >= endDate && dayDate <= today) {
              day.classList.add('sprint-overdue-range');

            } else if (dayDate > today && dayDate < endDate) {
              day.classList.add('sprint-range');
            }
            
          });
        

      }
    });
  });

fetch('http://localhost:3000/sprints/sprint-tasks')
  .then(res => res.json())
  .then(sprintsTasks => {
    console.log(sprintsTasks.length)
    document.querySelector('#js-task-amount')
      .innerHTML = sprintsTasks.length;

    let tasksHTML = '';

    sprintsTasks.forEach(task => {
      tasksHTML += `<li>${task.title}</li>`;
    });

    document.querySelector('#js-remaning-tasks')
      .innerHTML = tasksHTML;

  });

 

