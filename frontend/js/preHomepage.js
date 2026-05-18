        const username = localStorage.getItem('username');
        if (!username) window.location.href = 'signin.html';

        fetch(`http://localhost:3000/groups/user/${username}/groups`)
            .then(r => r.json())
            .then(data => {
                if (!data.groups || data.groups.length === 0) return;
                document.getElementById('previousGroups').style.display = 'block';
                const list = document.getElementById('groupList');
                data.groups.forEach(group => {
                    const card = document.createElement('div');
                    card.className = 'group-card';
                    card.innerHTML = `
                        <p class="group-card-name">${group.name}</p>
                        <p class="group-card-sub">${group.programme} · Semester ${group.semester} · <code style="font-size:11px;">${group.groupCode}</code></p>
                    `;
                    card.addEventListener('click', () => {
                        localStorage.setItem('groupCode', group.groupCode);
                        window.location.href = 'HomePage.html';
                    });
                    list.appendChild(card);
                });
            })
            .catch(() => {});