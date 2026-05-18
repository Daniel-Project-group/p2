//Library to solve lp using simplex
const solver = require('javascript-lp-solver');
// Helper function to calculate score for one member on one task
function scoreMember(member, relevantCompetences, mode) {
    //total variable for totalscore for users
    let total = 0;
    //loop through all relevant competneces
    for (let competence of relevantCompetences) {
        // find all answers for questions with competence matching the relevant competence
        const answer = member.answers.find(a => a.competence === competence);
        // If the is no such answers continue to next iteration
        if (!answer) continue;
        // If mode is profiecency or learning, we add the answers profieciency score to total, since the both use proficiency score
        if (mode === "proficiency" || mode === "learning") {
            total += answer.proficiency;
        }
        // else if mode is interest we add the interest score of the answer
        else if (mode === "interest") {
            total += answer.interest;
        }
    }
    // We return the score of the member by divding the total with amount of relevant competences, to get the average score, and divide by 10 to make it from 0-1
    return total / relevantCompetences.length / 10;
}


// Function that solve the LP problem 
function assignTasks(tasks, memberProfiles, mode) {
    //We first begin by defining the things that are general for all modes, then we go down to the specific mode
    //Proficiency mode has one more additional constraint compared to the other modes.
    //This constraint is that all users must have a score of 5/10 in all competences a task contains
    //The constrain will be handled via a helper function, instead of as an actual constraint
    //However, if there is no feasible solution for the threshold 0.5, then it decrements by 0.1 until feasible is found

    //To solve this one creates two variables. One called notFeasible that starts as true and one called thredshold that starts at 0.5
    //The code rest of the function is then wrapped in a while that runs while notFeasible is true.
    //And threshold is decremented by 0.1 at the end of the function

    let threshold = 0.5;
    let notFeasible = true;

    while (notFeasible) {
        //object to store the variables
        const variables = {};
        //object to store the constraint
        const constraints = {};
        //safety break if threshold goes under 0
        if (threshold < 0) break;
        //Loop through all task member combinations
        for (const task of tasks) {
            for (const member of memberProfiles) {

                if (mode === "proficiency") {
                    if (!isProficiencyEgligible(member, task, threshold)) continue;
                }
                // Create a key for each combination based on username and task
                const key = `${member.username}_${task.id}`;
                // Calculate the score the member has for the task
                const score = scoreMember(member, task.relevantCompetences, mode);
                // Add to variables object with the username task combination as the key
                // And with an object containing the score and username:1, which is used for saying that the user has been assigned a task. 
                //Also add [task.id]:1, cause if user is added to task then task gets one more user
                variables[key] = { score: score, [member.username]: 1, [task.id]: 1 };
            }
        }
        //Now that we have variables we need to create constraints

        //First constraint, each user is added only to one task
        for (const member of memberProfiles) {
            //When lp solver adds up all variables with tag member.username, total must add up to 1
            constraints[member.username] = { equal: 1 };
        }

        // Second constraint, each task has between 1 and max users
        for (const task of tasks) {
            //when lp solver adds up variables with tag task.id, they must sum up to between 1 and max members on task
            constraints[task.id] = { min: 1, max: task.quantity };
        }
        // Third and last general constraint. All decision variables are binary (0 or 1)
        // To achieve this, we can define an ints object for the javascript-lp-solver, telling it decision variables are binary

        //One creates ints array, loops through variable keys and sets them to 1.
        // The ints object here just tells lp solver that they are all integers, which is necessary as decision variables should only be binary
        // Simplex works with continious values, so otherwise it might find that assigning user to task could be 0.7, which would be perfectly fine mathematically, but does not make sense in this system
        let ints = {};
        for (const key of Object.keys(variables)) {
            ints[key] = 1;
        }

        //Now that all the general constraints and variables are out the way, we need to solve the problem based on the distribution modes
        if (mode === "proficiency" || mode === "interest") {
            //Proficiency and interest mode are both trying to maximize the score based on their corresponding question answers
            //The lp-solver model for proficiency and interest want to max the score based on the aforementioned constraints, varaibles and ints
            //The only difference between them are that proficiency has an extra constraint, and they use the answers from different questions.
            //However, this does not matter when solving the problem, as those things have already been determined before this
            //The lp-solver model in this case will look like:
            const model = {
                optimize: "score",
                opType: "max",
                constraints: constraints,
                variables: variables,
                ints: ints
            };
            //We call the lp-solver with this model and store its result
            const result = solver.Solve(model);

            //If result is feasible set notFeasible to false and call assignment
            if (result.feasible) {
                notFeasible = false;
                //We call assignment function to create array of assignment objects and return it
                return assignment(result, tasks, memberProfiles);
            } else {
                //Decrement threshold
                threshold -= 0.1;
            }
        } else {
            //If the mode is learning, it is a minimzation problem instead, but else the problem is called the same way
            const model = {
                optimize: "score",
                opType: "min",
                constraints: constraints,
                variables: variables,
                ints: ints
            };
            //We call the lp-solver with this model and store its result
            const result = solver.Solve(model);

            //If result is feasible set notFeasible to false and call assignment
            if (result.feasible) {
                notFeasible = false;
                //We call assignment function to create array of assignment objects and return it
                return assignment(result, tasks, memberProfiles);
            } else {
                //Decrement threshold
                threshold -= 0.1;
            }
        }
    }
}

//Helper function to check if a task is eglible for the user when distributing using the proficiency mode
//If the user scores under a certain threshold in some of the competence of the task, the user is deemed not egligable for the task
function isProficiencyEgligible(member, task, threshold) {
    //loop through competences of each task
    for (const competence of task.relevantCompetences) {
        // find all answers for questions with competence matching the relevant competence
        const answer = member.answers.find(a => a.competence === competence);
        //If there is no answer just go to next iteration
        if (!answer) continue;
        //If there is an answer and the user is under threshold return false
        if (answer.proficiency / 10 < threshold) return false;
    }
    //Else if no answers were under the threshold return true meaning he/she is egligeble.
    return true;
}

// assignment function that creates an array of assignments based on results from linear optimzation problem
function assignment(result, tasks, memberProfiles) {
    //Create and empty assigments array
    let assignments = [];
    //loop through all tasks
    for (const task of tasks) {
        //create an assignedTo array for each task
        let assignedTo = [];
        //loop through all members
        for (const member of memberProfiles) {
            //create a key using members username and task id
            const key = `${member.username}_${task.id}`;
            //if member is assigned to task, meaning that result[key] is 1, 
            if (result[key] === 1) {
                //push user to the assignedTo array
                assignedTo.push(member.username);
            }
        }
        //push each task and the members assigned to it to assignments array
        assignments.push({
            task: task.id,
            title: task.title,
            assignedTo: assignedTo
        });
    }
    //return assignments array
    return assignments;
}

//export the assignTasks function
module.exports = { assignTasks };
