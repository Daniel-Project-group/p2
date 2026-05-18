// Find the form
const taskForm = document.getElementById('taskForm');

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

    // Get all the values from the form
    const title = document.getElementById('TaskTitle').value;
    const description = document.getElementById('TaskDescription').value;
    const quantity = document.getElementById('Quantity').value;
    const duedate = document.getElementById('DueDate').value;

    // Get the selected radio button (oriented)
    const orientedRadio = document.querySelector('input[name="oriented"]:checked');
    const oriented = orientedRadio ? orientedRadio.value : null;

    // Send to server
    try {
        const response = await fetch('http://localhost:3000/tasks/newtask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: description,
                quantity: quantity,
                duedate: duedate,
                oriented: oriented,
                createdBy: username
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
});