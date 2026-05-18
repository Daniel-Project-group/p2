const sprintForm = document.getElementById('sprintForm');

sprintForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get the logged-in user
    const username = localStorage.getItem('username');
    if (!username) {
        alert('You need to be logged in to create a sprint');
        window.location.href = 'signin.html';
        return;
    }

    // Get the group the user is in
    const groupCode = localStorage.getItem('groupCode');
    if (!groupCode) {
        alert('No group selected. Please select a group first.');
        window.location.href = 'PreHomePage.html';
        return;
    }

    // Get form values
    const title = document.getElementById('SprintTitle').value;
    const description = document.getElementById('SprintDescription').value;
    const dueDate = document.getElementById('DueDate').value;

    const typeRadio = document.querySelector('input[name="type"]:checked');
    const type = typeRadio ? typeRadio.value : null;

    if (!type) {
        alert('Please select a sprint type');
        return;
    }

    // Send to server
    try {
        const response = await fetch('http://localhost:3000/createSprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupCode: groupCode,
                title: title,
                description: description,
                type: type,
                dueDate: dueDate,
                createdBy: username
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Sprint created successfully!');
            window.location.href = 'HomePage.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Could not connect to the server. Is it running?');
        console.error(error);
    }
});