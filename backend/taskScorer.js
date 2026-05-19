//Imports the .env making all variables in it avaliable here
require('dotenv').config();
//Fast model, since picking picking relevant is a quite simple task that does not need a lot of computation
const MODEL_FAST = 'llama-3.1-8b-instant';

//async function to call Groq AI using groq API
async function callGroq(model, prompt) {
  //sends HTTP POST request to Groq API endpoint and await response
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    //POST cause we are also sending data to API not just retrieving
    method: 'POST',
    headers: {
      //Send authorization using bearer that is standard format for sending tokens in HTTP headers
      // process.env.GROQ_API_KEY is our Grok API key from .env file which stores secret info
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      //tell the API we are sending JSON format
      'Content-Type': 'application/json'
    },
    // Send body telling which model, message saying its user message with content as prompt text, and tell that response is JSON format.
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
  });

  // Parses http response as JSON
  const data = await response.json();

  //If API returns error code throw error with details of data, so one knows what went wrong
  if (!response.ok) {
    throw new Error(`Groq API error: ${JSON.stringify(data)}`);
  }

  //Extracts response text from the API response. Here choices[0] is just first response Grok gives in case it gives multiple
  // message.content is the text the model generated, and that is now parsed to JSON.
  return JSON.parse(data.choices[0].message.content);
}

async function relevantCompetencesForTask(taskTitle, taskDescription, competenceNames) {
  //The Grok model that will be used is the fast model
  //Prompt for Grok to return JSON with relevant competences
  const prompt = `This a prompt telling you what to do. You will get a task for an university group project together with a description of this task.
  Furthermore, you will also recieve a list of competences which are relevant for the given education. Based on these competences, and the task and its description,
  you are asked to return a JSON object containing only the names of competences that are relevant to this task, such as this {"competences": ["Report Writing", "Algorithms"]}, with the competences you deem to be relevant for the task.
  Here is the title of the task: ${taskTitle}, here is the task description: ${taskDescription}, and here are the relevant competences: ${competenceNames}.`;

  //Result from GROK in JSON format
  const result = await callGroq(MODEL_FAST, prompt);

  //return competences
  return result.competences;
}

module.exports = { relevantCompetencesForTask };