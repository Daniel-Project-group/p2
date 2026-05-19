//Load the .env file which is necessary for Groq API key
require('dotenv').config();
//Import fs for file reading
const fs = require('fs');
//Import Nodes built in file system path for building file paths
const path = require('path');

//Build path to a cache folder
const CACHE_DIR = path.join(__dirname, 'cache');

//If cache folder does not exist
if (!fs.existsSync(CACHE_DIR)) {
  //create the cache folder synchroniously
  fs.mkdirSync(CACHE_DIR);
}

// The two grok models that will be used for different things.
const MODEL_FAST = 'llama-3.1-8b-instant';     // used for simple extraction tasks
const MODEL_GOOD = 'llama-3.3-70b-versatile';  // used for reasoning/generation tasks


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


async function fetchCurriculum(url) {
  //Fetch the curriculum and wait for the response 
  const response = await fetch(url);
  //Wait for the response body and read it as a string
  const html = await response.text();
  // As the llm has a limited context, the text has to be processed to remove uncecessary things
  // .replace(/<[^>]+>/g, ' ') removes all html tags by replacing everything starting and ending with < and > with an empty string
  // Afterwards .replace(/\s+/g, ' ') removes all whitespaces that now exist after removing the html
  // Then .trim removes leading and trailling spaces and slice saves the first 8000 characthers of the curriculum. 
  // This is to make sure that it does not exceed the LLMs context limit and make it crash
  // These 8000 first characthers are then returned
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
}

//Function to extract the name of the courses given semester and text describing curriculum
async function extractCourseNames(semester, curriculumText) {
  //Prompt telling the LLM what to do and how to do it 
  //We only use the first 2000 characthers here, as there usually is a course list section at the beginning, and 2000 is usually enough to capture that
  // We want to use as few characthers to make the LLM API calls cheaper
  const prompt = `
You are reading a university curriculum document.
Extract all course or module names that belong to semester ${semester}.
Also include courses from earlier semesters (1 to ${semester - 1}) since students have already had those courses.

Return ONLY a JSON object with a "courses" array of course names in English. Example:
{"courses": ["Algorithms and Data Structures", "Web Programming", "Linear Algebra"]}

Curriculum table of contents:
${curriculumText.slice(0, 2000)}
`;

  //try catch in case API call fails and errors appear
  try {
    //call groq with fast model and prompt 
    const parsed = await callGroq(MODEL_FAST, prompt);
    //Log the output from Grow for debug
    console.log('Step 1 raw output:', JSON.stringify(parsed));

    //If LLM returned an array directly instead of an object just return it
    if (Array.isArray(parsed)) return parsed;

    // Loop through the values of the object
    for (const val of Object.values(parsed)) {
      //If one of the values is an array, it is the courses array
      if (Array.isArray(val)) return val;
    }
    //If it didn't return either object or array just return empty array
    return [];
    //If there were any errors log them and return empty array
  } catch (error) {
    console.error('Error extracting course names:', error.message);
    return [];
  }
}

//Helper function to create relevant competences based on the courses
async function generateCompetencesFromCourses(programme, semester, courseNames) {
  const prompt = `
You are building a competence profile for a "${programme}" student at Aalborg University on semester ${semester}.

Based on these courses they have studied up to and including semester ${semester}:
${courseNames.join(', ')}

Generate 6-10 practical competences that reflect what this student can actually do based on the courses they have studied.
Each competence should map directly to one or more of the courses above.

Return ONLY a valid JSON object in this exact format, no markdown:
{
  "programme": "${programme}",
  "semester": ${semester},
  "competences": [
    {
      "name": "Short name (2-4 words)",
    }
  ]
}

Rules:
- Generate a balanced mix of:
  * Technical/subject competences (e.g. "Programming", "Algorithms")  
  * Project work competences (e.g. "Report Writing", "Problem Analysis", "Group Work")
  * Research competences (e.g. "Literature Review", "Methodology")
- Competence names must be short (2-4 words) and specific
- Include at least 2 project/report related competences
- Include at least 1 research competence
- All output must be in English
- Only return the JSON, nothing else
  `;


  //call Groq using the Good model and prompt and return the JSON Groq as generated 
  return await callGroq(MODEL_GOOD, prompt);
}

// helper function to generete competences if no currculum url or text was provided or step 1 didnt work
async function generateFromKnowledge(programme, semester) {
  //Prompt to tell LLM to just create the competences based on its knowledge
  const prompt = `
Generate a competence profile for a "${programme}" student at Aalborg University on semester ${semester}.
Use your knowledge of what this programme typically covers up to semester ${semester}.

Return ONLY a valid JSON object, no markdown:
{
  "programme": "${programme}",
  "semester": ${semester},
  "competences": [
    {
      "name": "Short name (2-4 words)",
    }
  ]
}

Rules:
- Generate a balanced mix of:
  * Technical/subject competences (e.g. "Programming", "Algorithms")  
  * Project work competences (e.g. "Report Writing", "Problem Analysis", "Group Work")
  * Research competences (e.g. "Literature Review", "Methodology")
- Competence names must be short (2-4 words) and specific
- Include at least 2 project/report related competences
- Include at least 1 research competence
- All output must be in English
- Only return the JSON, nothing else
`;
  //call Groq using the Good model and prompt and return the JSON Groq as generated 
  return await callGroq(MODEL_GOOD, prompt);
}

//Helper function to create the proficiency and interest questions for each competence
function createQuestions(competenceProfile) {
  //Loop through all competences of competenceProfile
  for (const competence of competenceProfile.competences) {
    //Create a proficiency and interest question and add them to the competence objects
    competence.competenceQuestion = `"How proficient are you at ${competence.name}?`;
    competence.interestQuestion = `"How interested are you in ${competence.name}?`;
  }
}

//Main function that creates/gets competence profile. Here curriculumUrl and text = null as they are not necessary and one can call function without them
async function getCompetenceProfile(programme, semester, curriculumUrl = null, curriculumText = null) {
  //Convert programme to lowercase and replace all spaces with dashes.
  //Thereafter add - and then semester.
  //This creates and identifier for the competence profile for programme semester combination
  //For Law 2 it would be Law-2 and Computer Science 2 would be Computer-Science-2
  const key = `${programme.toLowerCase().replace(/\s+/g, '-')}-${semester}`;
  //Then build cache path using that key, so one can find cache path for all semester programme combinations
  // As CACHE_DIR is /p2/backend/cache, for Law-2 cache would become 
  // /p2/backend/cache/Law-2.json
  const cachePath = path.join(CACHE_DIR, `${key}.json`);

  //If cache file already exists for this education semester combination
  if (fs.existsSync(cachePath)) {
    //Log that ur just gonna use cache file
    console.log(`Using cached profile for ${key}`);
    //Parse the cache file from JSON to javascript object and just use that 
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }

  //Variable to store the generated profile
  let profile;

  //If currliclum was prvoided either as text or url 
  if (curriculumText || curriculumUrl) {
    //Just save the text and use that
    let text = curriculumText;
    //If provided only as URL
    if (!text) {
      //Fetch the text from the URL and log it
      console.log(`Fetching curriculum from ${curriculumUrl}...`);
      text = await fetchCurriculum(curriculumUrl);
    }

    //Log that courses are being extracted
    console.log(`Extracting course names for semester ${semester}...`);
    //Extract coursenames from curriculum text and log them
    const courseNames = await extractCourseNames(semester, text);
    console.log(`Found courses: ${courseNames.join(', ')}`);

    //If the array with course names is empty log it
    if (courseNames.length === 0) {
      console.log('No courses found, falling back to LLM knowledge...');
      //And if it is empty call the LLM with the prompt to create the profile from Knowledge instead
      profile = await generateFromKnowledge(programme, semester);
      //else if courseNames is not empty
    } else {
      //create competences from courses using generateCompetencesFromCourses function and store them in profile variable
      console.log(`Step 2 — generating competences from course names...`);
      profile = await generateCompetencesFromCourses(programme, semester, courseNames);
    }
  }
  //If curriculum was not provided at all, just call the LLM with the prompt to create the profile from Knowledge instead
  else {
    console.log(`No curriculum provided, using LLM knowledge...`);
    profile = await generateFromKnowledge(programme, semester);
  }

  //Call createQuestions helper function to create questions for the competence profile
  createQuestions(proffile);

  //Log the generated profile
  console.log('Generated profile:', JSON.stringify(profile, null, 2));
  //Write the profile to the cache file in JSON format
  fs.writeFileSync(cachePath, JSON.stringify(profile, null, 2));
  //log that it has been cached in the cache file and give its path
  console.log(`Profile cached at ${cachePath}`);

  //Return the newly created comptence profile
  return profile;
}

module.exports = { getCompetenceProfile };