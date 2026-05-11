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
    calenderHTML += `<div class="calendar-day current-day">
      <p class="DateNumber">${i}</p></div>`;
  } else {
    calenderHTML += `<div class="calendar-day">
    <p class="DateNumber">${i}</p></div>`;
  }
}

//Adds the HTML to the page
document.querySelector('#calendarGrid')
  .innerHTML = calenderHTML;

