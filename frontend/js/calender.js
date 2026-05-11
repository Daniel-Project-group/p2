const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();

//Gets which week day, the first day in the month lands on
const firstDay = new Date(currentYear, currentMonth, 1)
  .getDay();
//Gets the amount of days in the month
const daysInMonth = new Date(currentYear, currentMonth + 1, 0)
  .getDate();

console.log(firstDay, daysInMonth)

