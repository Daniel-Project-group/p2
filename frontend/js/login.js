// Find the login form
const loginForm = document.querySelector('form');

loginForm.addEventListener('submit', async function (event) {
    // Stop the form from doing its default thing
    event.preventDefault();

    // Get the values from the form
    const email = document.getElementById('Email').value;
    const password = document.getElementById('password').value;

    // Send the data to our Node.js server
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password }),
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('username', data.username);
            window.location.href = 'PreHomePage.html';
        } else {
            document.getElementById("Error").textContent = data.message;
        }
    } catch (error) {
        alert('Could not connect to the server. Is it running?');
        console.error(error);
    }
});