const groupIdInput = document.querySelector('#groupId');
const joinButton   = document.querySelector('#joinButton');

joinButton.addEventListener('click', async function () {
    const username  = localStorage.getItem('username');
    const groupCode = groupIdInput.value.trim();

    joinButton.disabled    = true;
    joinButton.textContent = 'Joining...';

    try {
        const response = await fetch('http://localhost:3000/groups/groupJoin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupCode, username })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('groupCode', groupCode);
            window.location.href = '../html/competence-profile.html';
        } else {
            joinButton.disabled    = false;
            joinButton.textContent = 'Join group';
            alert(data.message || 'Failed to join group');
        }
    } catch (error) {
        console.error('Could not join group', error);
        joinButton.disabled    = false;
        joinButton.textContent = 'Join group';
    }
});
