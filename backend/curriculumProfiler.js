//Load the .env file which is necessary for Groq API key
require('dotenv').config();
//Import fs for file reading
const fs = require('fs');
//Import Nodes built in file system path for building file paths
const path = require('path');


const CACHE_DIR = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) {
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
  const response = await fetch(url);
  const html = await response.text();
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
}

// Step 1: extract just the course names for the given semester from the curriculum text
async function extractCourseNames(semester, curriculumText) {
  const prompt = `
You are reading a university curriculum document.
Extract all course or module names that belong to semester ${semester}.
Also include courses from earlier semesters (1 to ${semester - 1}) since students have already studied those.

Return ONLY a JSON object with a "courses" array of course names in English. Example:
{"courses": ["Algorithms and Data Structures", "Web Programming", "Linear Algebra"]}

Curriculum table of contents:
${curriculumText.slice(0, 2000)}
`;

  try {
    const parsed = await callGroq(MODEL_FAST, prompt);
    console.log('Step 1 raw output:', JSON.stringify(parsed));

    if (Array.isArray(parsed)) return parsed;

    // search for the first array value in the object
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val)) return val;
      // model returned a comma-separated string instead of an array
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Error extracting course names:', error.message);
    return [];
  }
}

// Step 2: generate competences from the list of course names
async function generateCompetencesFromCourses(programme, semester, courseNames) {
  const prompt = `
You are building a competence profile for a "${programme}" student at Aalborg University on semester ${semester}.

Based on these courses they have studied up to and including semester ${semester}:
${courseNames.join(', ')}

Generate 6-10 practical competences that reflect what this student can actually do.
Each competence should map directly to one or more of the courses above.

Return ONLY a valid JSON object in this exact format, no markdown:
{
  "programme": "${programme}",
  "semester": ${semester},
  "competences": [
    {
      "name": "Short name (2-4 words)",
      "competenceQuestion": "How proficient are you in this area? (1-10)",
      "interestQuestion": "How interested are you in this area? (1-10)"
    }
  ]
}

Rules:
- Generate a balanced mix of:
  * Technical/subject competences (e.g. "Programming", "Algorithms")  
  * Project work competences (e.g. "Report Writing", "Problem Analysis", "Group Work")
  * Research competences (e.g. "Literature Review", "Methodology")
- Competence names must be short (2-4 words) and specific
- Include at least 2-3 project/report related competences
- All output must be in English
- Only return the JSON, nothing else
  `;

  return await callGroq(MODEL_GOOD, prompt);
}

// Fallback: no curriculum provided, use LLM general knowledge
async function generateFromKnowledge(programme, semester) {
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
      "competenceQuestion": "How proficient are you in this area? (1-10)",
      "interestQuestion": "How interested are you in this area? (1-10)"
    }
  ]
}

Rules:
- 6-10 competences, short names (2-4 words), specific to the programme
- All output in English
- Only return the JSON
`;

  return await callGroq(MODEL_GOOD, prompt);
}

async function getCompetenceProfile(programme, semester, curriculumUrl = null, curriculumText = null) {
  const key = `${programme.toLowerCase().replace(/\s+/g, '-')}-${semester}`;
  const cachePath = path.join(CACHE_DIR, `${key}.json`);

  if (fs.existsSync(cachePath)) {
    console.log(`Using cached profile for ${key}`);
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }

  let profile;

  if (curriculumText || curriculumUrl) {
    let text = curriculumText;
    if (!text) {
      console.log(`Fetching curriculum from ${curriculumUrl}...`);
      text = await fetchCurriculum(curriculumUrl);
    }

    console.log(`Step 1 — extracting course names for semester ${semester}...`);
    const courseNames = await extractCourseNames(semester, text);
    console.log(`Found courses: ${courseNames.join(', ')}`);

    if (courseNames.length === 0) {
      console.log('No courses found, falling back to LLM knowledge...');
      profile = await generateFromKnowledge(programme, semester);
    } else {
      console.log(`Step 2 — generating competences from course names...`);
      profile = await generateCompetencesFromCourses(programme, semester, courseNames);
    }
  } else {
    console.log(`No curriculum provided, using LLM knowledge...`);
    profile = await generateFromKnowledge(programme, semester);
  }

  console.log('Generated profile:', JSON.stringify(profile, null, 2));
  fs.writeFileSync(cachePath, JSON.stringify(profile, null, 2));
  console.log(`Profile cached at ${cachePath}`);

  return profile;
}

async function getCompetenceNames(programme, semester, curriculumUrl = null, curriculumText = null) {
  const profile = await getCompetenceProfile(programme, semester, curriculumUrl, curriculumText);
  return profile.competences.map(c => c.name);
}

module.exports = { getCompetenceProfile, getCompetenceNames };