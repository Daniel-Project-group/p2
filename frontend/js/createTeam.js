const groupName        = document.querySelector('#groupName');
const groupId          = document.querySelector('#groupId');
const programmeInput   = document.querySelector('#programme');
const semesterInput    = document.querySelector('#semester');
const curriculumUrlInput  = document.querySelector('#curriculumUrl');
const curriculumFileInput = document.querySelector('#curriculumFile');
const groupButton      = document.querySelector('#createGroupButton');

groupButton.addEventListener('click', async function () {
    const username = localStorage.getItem('username');

    if(!username){
        alert("No logged-in user found. Please log in again.")
        return;
    }
    const file = curriculumFileInput.files[0];
    const url  = curriculumUrlInput.value.trim();
    
    if (!url && !file) {
        alert('Please provide a curriculum URL or upload a PDF file');
        return;
    }

    const formData = new FormData();
    formData.append('name',      groupName.value);
    formData.append('groupCode', groupId.value);
    formData.append('username',  username);
    formData.append('programme', programmeInput.value);
    formData.append('semester',  semesterInput.value);
    if (url)  formData.append('curriculumUrl',  url);
    if (file) formData.append('curriculumFile', file);

    groupButton.disabled    = true;
    groupButton.textContent = 'Creating group...';

    try {
        const response = await fetch('http://localhost:3000/groups/groupCreate', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('groupCode', groupId.value);
            window.location.href = '../html/competence-profile.html';
        } else {
            groupButton.disabled    = false;
            groupButton.textContent = 'Create group';
            alert(data.message || 'Failed to create group');
        }
    } catch (error) {
        console.error("Couldn't create group", error);
        groupButton.disabled    = false;
        groupButton.textContent = 'Create group';
    }
});
