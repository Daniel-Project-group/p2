import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 5 minute timeout — large models take a while to load on first call
const ollama = new Ollama({
  fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(300_000) })
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR  = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

const MODEL_FAST = 'qwen2.5:3b'; // used for simple extraction tasks
const MODEL_GOOD = 'mistral';    // used for reasoning/generation tasks

async function fetchCurriculum(url) {
  const response = await fetch(url);
  const html     = await response.text();
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
}

// Step 1: extract just the course names for the given semester from the curriculum text
async function extractCourseNames(semester, curriculumText) {
  const prompt = `
You are reading a university curriculum document.
Extract all course or module names that belong to semester ${semester}.
Also include courses from earlier semesters (1 to ${semester - 1}) since students have already studied those.

Return ONLY a JSON array of course names in English, nothing else. Example:
["Algorithms and Data Structures", "Web Programming", "Linear Algebra"]

Curriculum text:
${curriculumText.slice(0, 8000)}
`;

  const response = await ollama.chat({
    model: MODEL_FAST,
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { num_ctx: 4096 },
    keep_alive: '10m'
  });

  try {
    const parsed = JSON.parse(response.message.content);
    // handle both ["course"] and {"courses": ["course"]} responses
    return Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
  } catch {
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
- Competence names must be short (2-4 words) and specific — e.g. "Algorithms & Data Structures", "Web Programming", "Report Writing"
- All output must be in English
- Only return the JSON, nothing else
`;

  const response = await ollama.chat({
    model: MODEL_GOOD,
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { num_ctx: 2048 },
    keep_alive: '10m'
  });

  return JSON.parse(response.message.content);
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

  const response = await ollama.chat({
    model: MODEL_GOOD,
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { num_ctx: 2048 },
    keep_alive: '10m'
  });

  return JSON.parse(response.message.content);
}

export async function getCompetenceProfile(programme, semester, curriculumUrl = null, curriculumText = null) {
  const key       = `${programme.toLowerCase().replace(/\s+/g, '-')}-${semester}`;
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

    console.log(`Step 2 — generating competences from course names...`);
    profile = await generateCompetencesFromCourses(programme, semester, courseNames);
  } else {
    console.log(`No curriculum provided, using LLM knowledge...`);
    profile = await generateFromKnowledge(programme, semester);
  }

  console.log('Generated profile:', JSON.stringify(profile, null, 2));
  fs.writeFileSync(cachePath, JSON.stringify(profile, null, 2));
  console.log(`Profile cached at ${cachePath}`);

  return profile;
}

export async function getCompetenceNames(programme, semester, curriculumUrl = null, curriculumText = null) {
  const profile = await getCompetenceProfile(programme, semester, curriculumUrl, curriculumText);
  return profile.competences.map(c => c.name);
}
