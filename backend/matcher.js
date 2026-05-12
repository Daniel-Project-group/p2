// matcher.js
// This file figures out which group members should be assigned to which tasks.
// It looks at each member's competence profile and the task's competence scores,
// and matches them based on the sprint's delegation mode.

// Calculates how well a member fits a specific task
function scoreMember(member, taskScores, mode) {
    let totalScore = 0;

    for (const competence in taskScores) {
        const taskWeight = taskScores[competence]; // how relevant this competence is for the task (1-10)

        // Find this competence in the member's answers
        const answer = member.answers.find(a => a.competence === competence);
        if (!answer) continue; // member wasn't asked about this competence, skip it

        if (mode === 'proficiency') {
            // Reward members who are already good at the relevant competences
            totalScore += taskWeight * answer.proficiency;

        } else if (mode === 'interest') {
            // Reward members who are most interested in the relevant competences
            totalScore += taskWeight * answer.interest;

        } else if (mode === 'learning') {
            // Reward members who are interested but not yet proficient
            // The idea: high interest + low proficiency = great learning opportunity
            const roomToGrow = 10 - answer.proficiency;
            totalScore += taskWeight * answer.interest * roomToGrow;
        }
    }

    return totalScore;
}

// Main function: assigns members to tasks based on the delegation mode
// tasks: array of task objects (each with taskScores and quantity)
// memberProfiles: array of { username, answers: [{competence, proficiency, interest}] }
// mode: 'proficiency', 'interest', or 'learning'
function assignTasks(tasks, memberProfiles, mode) {
    const assignments = [];

    // Keep track of how many tasks each member has been assigned
    // so we don't overload one person
    const taskCount = {};
    memberProfiles.forEach(m => { taskCount[m.username] = 0; });

    for (const task of tasks) {
        // Score every member for this task
        const scored = memberProfiles.map(member => ({
            username: member.username,
            score: scoreMember(member, task.taskScores, mode)
        }));

        // Sort by score, best fit first
        // If scores are tied, prefer whoever has fewer tasks already
        scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return taskCount[a.username] - taskCount[b.username];
        });

        // Pick the top N members (N = how many people this task needs)
        const assignedTo = scored.slice(0, task.quantity).map(s => s.username);

        // Update the task count for each assigned member
        assignedTo.forEach(username => { taskCount[username]++; });

        assignments.push({
            taskId: task.id,
            title: task.title,
            assignedTo: assignedTo
        });
    }

    return assignments;
}

module.exports = { assignTasks };
