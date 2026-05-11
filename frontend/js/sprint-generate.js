document.querySelector('#sprintForm')
  .addEventListener('submit', (input) => {
    input.preventDefault();

    const sprint = {
      title: document.querySelector('#SprintTitle').value,
      description: document.querySelector('#SprintDescription').value,
      enddate: document.querySelector('#EndDate').value
    };

    fetch('http://localhost:3000/newsprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprint)
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
    })
    .catch(err => {
      console.log('Error:', err);
    });
});
