const sideBarHTML = `
<nav class="SideBar">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 32" width="180" height="32" id="Logo">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500&amp;display=swap');

            .wordmark {
                font-family: 'Fraunces', Georgia, serif;
                font-weight: 500;
                font-size: 22px;
                letter-spacing: -0.02em;
                fill: #14140f;
            }
        </style>
        <circle cx="11" cy="16" r="11" fill="#14140f" />
        <circle cx="11" cy="16" r="6" fill="#ff5b1f" />
        <text x="32" y="23" class="wordmark">Delegate</text>
    </svg>
    <hr>
    <h5>Workspace</h5>
    <a href="HomePage.html" class="SideBarButton"> <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" stroke="currentColor" stroke-width="1.4" />
            <rect x="9" y="2" width="5" height="5" stroke="currentColor" stroke-width="1.4" />
            <rect x="2" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.4" />
            <rect x="9" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.4" />
        </svg> Dashboard </a>

    <a href ="calender.html" class ="SideBarButton"> 
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" stroke-width="1.4" />
            <path d="M2 6h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" />
        </svg> Calender</a>

    <a href="competence-profile.html" class="SideBarButton"> 
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
    </svg> Competence profile </a>      

    <a href="Sprint-Overview1.html" class="SideBarButton"> 
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 3h9M4 8h9M4 13h9" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" />
                <circle cx="2" cy="3" r="1" fill="currentColor" />
                <circle cx="2" cy="8" r="1" fill="currentColor" />
                  <circle cx="2" cy="13" r="1" fill="currentColor" />
    </svg> Sprint overview</a>
  

    <a href="Sprint-Generate1.html" class="SideBarButton"> 
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightning" viewBox="0 0 16 16">
            <path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641zM6.374 1 4.168 8.5H7.5a.5.5 0 0 1 .478.647L6.78 13.04 11.478 7H8a.5.5 0 0 1-.474-.658L9.306 1z"/>
          </svg> Generate sprint</a>

    <a href = "pending-task.html" class="SideBarButton"> 
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4" />
        <path d="M8 4.5V8L10 9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg> Pending tasks</a>     
      

    <a id="AddTask" href="NewTask.html">+ Add task</a>


</nav>
`
const topBarHTML = `
            <div id="profile">
                <span id="userInitials">DB</span>

                <div id="dropdown">
                    <div class="dropdown-header">
                        <div id="dropdownUsername">Username</div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item">Settings</a>
                    <a href="#" class="dropdown-item logout" id="logoutBtn">Logout</a>
                </div>
            </div>

        </div>

`

//Adds the html to the page
document.querySelector('#sidebar').innerHTML = sideBarHTML;
document.querySelector('#topbar').innerHTML = topBarHTML;

const currentPage = window.location.pathname.split('/').pop();

//Checks with page the user is on, and highlights in the sidebar
document.querySelectorAll('.SideBarButton').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.remove('SideBarButton');
        link.classList.add('sidebarbuttonActive');
    }
});

const username = localStorage.getItem("username");

const userInitials = document.querySelector("#userInitials");
const dropdownUsername = document.querySelector("#dropdownUsername");
const logoutBtn = document.querySelector("#logoutBtn");
const welcomeText = document.querySelector("#welcomeText");

// If the user insnt logged in, then they're redirected to login page
if(!username){
    window.location.href = "signin.html"
}
// We check for all the individual elements 
// This ensures we dont return undefined values, say they were only conditioned by username
 if (welcomeText) {
    welcomeText.textContent = `Welcome Back ${username}`;
}

if (userInitials) {
    userInitials.textContent = username.substring(0, 2).toUpperCase();
}

if (dropdownUsername) {
    dropdownUsername.textContent = username;
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async function(event) {
        event.preventDefault();

    try{
        const response = await fetch('http://localhost:3000/auth/logout',{
            method: 'POST',
        });

        const data = await response.json();
        // If backend determines request isnt valid
        if(!response.ok){
            // Either backend responds or we fallback to logout fail
            console.log(data.message || "Logout fail")
            return;
        }
        localStorage.removeItem("username");
        window.location.href = "signin.html";
    // If the backend doesnt even respond / the request fails
    } catch (errror){
        console.error("Logout error:", error);
    }
    });
}