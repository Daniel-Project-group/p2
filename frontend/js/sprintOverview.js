 
 document.getElementById('logoutBtn').addEventListener('click', function (event) {
                event.preventDefault();
                localStorage.removeItem('username');
                window.location.href = 'signin.html';
            });
            const username = localStorage.getItem("username");
            if (username) {
                document.getElementById("userInitials").textContent = username.substring(0, 2).toLocaleUpperCase();
                document.getElementById("dropdownUsername").textContent = username;
            }
            else {
                window.location.href = "signin.html";
            }