const usernameCompetences  = localStorage.getItem('username');
const groupCode = localStorage.getItem('groupCode');

let competences = [];
let index = 0;
const answers = [];

const titleEl      = document.getElementById('title');
const profQuestion = document.getElementById('profQuestion');
const intQuestion  = document.getElementById('intQuestion');
const profSlider   = document.getElementById('profSlider');
const profValue    = document.getElementById('profValue');
const intSlider    = document.getElementById('intSlider');
const intValue     = document.getElementById('intValue');
const nextBtn      = document.getElementById('nextBtn');
const backBtn      = document.getElementById('backBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const questionBox  = document.getElementById('questionBox');
const questionNum  = document.getElementById('questionNum');

profSlider.addEventListener('input', () => { profValue.textContent = profSlider.value; });
intSlider.addEventListener('input',  () => { intValue.textContent  = intSlider.value;  });

function loadQuestion() {
    const competence = competences[index];

    titleEl.textContent      = competence;
    profQuestion.textContent = `How good are you at ${competence}?`;
    intQuestion.textContent  = `How interested are you in ${competence}?`;
    questionNum.textContent  = index + 1;

    const saved = answers[index];
    profSlider.value      = saved ? saved.proficiency : 5;
    intSlider.value       = saved ? saved.interest    : 5;
    profValue.textContent = saved ? saved.proficiency : 5;
    intValue.textContent  = saved ? saved.interest    : 5;

    progressFill.style.width = `${((index + 1) / competences.length) * 100}%`;
    progressText.textContent = `${index + 1} / ${competences.length}`;
    backBtn.disabled         = index === 0;
    nextBtn.textContent      = index === competences.length - 1 ? 'Finish' : 'Next';
}

nextBtn.addEventListener('click', async () => {
    answers[index] = {
        competence:  competences[index],
        proficiency: parseInt(profSlider.value),
        interest:    parseInt(intSlider.value)
    };
    index++;

    if (index < competences.length) {
        loadQuestion();
    } else {
        nextBtn.disabled = true;
        await fetch(`http://localhost:3000/profiles/group/${groupCode}/member-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameCompetences, answers })
        });
        questionBox.innerHTML = `
            <h2>Competence profile saved!</h2>
            <p>Share your group code with your teammates so they can join:</p>
            <div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-top:12px;">
                <code style="background:#f0ebe1;padding:8px 16px;border-radius:8px;font-size:1.2em;letter-spacing:0.05em;">${groupCode}</code>
                <button id="copyBtn" style="padding:8px 14px;background:#14140f;color:white;border:none;border-radius:8px;cursor:pointer;">Copy</button>
            </div>
            <p style="margin-top:24px;color:#888;font-size:14px;">Redirecting to dashboard in 5 seconds...</p>
        `;
        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(groupCode);
            document.getElementById('copyBtn').textContent = 'Copied!';
        });
        setTimeout(() => { window.location.href = 'HomePage.html'; }, 5000);
    }
});

backBtn.addEventListener('click', () => {
    if (index > 0) { index--; loadQuestion(); }
});

async function init() {
    if (!groupCode) {
        questionBox.innerHTML = '<h2>No group found. Please create or join a group first.</h2>';
        return;
    }

    titleEl.textContent = 'Loading competences...';

    for (let attempt = 0; attempt < 20; attempt++) {
        const res = await fetch(`http://localhost:3000/competences/group/${groupCode}/competences`);
       
        if (res.status === 202) {
            titleEl.textContent = 'The AI is generating your competences, please wait...';
            await new Promise(r => setTimeout(r, 3000));
            continue;
        }
        if (res.ok) {
            const data = await res.json();

            competences = data.competences;

            if (!Array.isArray(competences) || competences.length === 0) {
                questionBox.innerHTML = '<h2>No competences found.</h2>';
                return;
            }
            loadQuestion();
            return;
        }
        break;
    }

    questionBox.innerHTML = '<h2>Could not load competences. Please try again later.</h2>';
}

init();