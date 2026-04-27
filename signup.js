// Find the signup form
const signupForm = document.querySelector('form');

signupForm.addEventListener('submit', async function (event) {
    // Stop the form from doing its default thing (going to signup.php)
    event.preventDefault();

    // Get the values from the form
    const email = document.getElementById('Email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check passwords match
    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    // Send the data to our Node.js server
    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = 'signin.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Could not connect to the server. Is it running?');
        console.error(error);
    }
});