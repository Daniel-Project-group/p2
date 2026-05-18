
renderPendingTasks();

//Renders the current pending tasks
function renderPendingTasks() {
  //Gets every task with the status "pending"
  fetch('http://localhost:3000/pending-tasks')
  .then(res => res.json())
  .then(pendingTasks => {

    let pendingTaskHTML = '';

    //Adds every tasks to its own box in HTML
    pendingTasks.forEach((task, index) => {
      pendingTaskHTML += `
      <div class="pending-card" id="pending-card-${task.id}" style="animation-delay: ${index * 0.1}s">
        <h3>${task.title}</h3>
        <p class="pending-description">${task.description}</p>
        <p class="pending-creator">Suggested by: <strong>${task.createdBy}</strong></p>
        <div class="pending-buttons">
          <button class="accept-btn">Accept</button>
          <button class="reject-btn">Reject</button>
        </div>
      </div>
      `
    });

    document.querySelector('.pending-grid')
      .innerHTML = pendingTaskHTML;

    addEvent('accept');
    addEvent('reject');
  });
  
}
  //Adds the event listener to all the accept and reject buttons
  function addEvent(status) {
  document.querySelectorAll(`.${status}-btn`)
    .forEach((button) => {
    button.addEventListener('click', () => {
    const cardId = (button.closest('.pending-card').id)
      .replace('pending-card-', '');

    fetch(`http://localhost:3000/task-${status}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(cardId) })
    })
    .then(() => renderPendingTasks());
  })
  });
  }