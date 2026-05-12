import ollama from 'ollama';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = './cache';

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

async function fetchCurriculum(url) {
  const response = await fetch(url);
  const html = await response.text();

  const cleaned = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.slice(0, 6000);
}

async function generateProfileFromCurriculum(programme, semester, curriculumText) {
  const prompt = `
You are an academic assistant helping build a competence profile for university students.

Below is the curriculum for semester ${semester} of the "${programme}" programme at Aalborg University.
Your job is to:
1. Generate a list of 6-10 competences derived directly from this curriculum
2. For each competence, write one question to assess skill level (answered 1-10)
3. For each competence, write one question to assess interest level (answered 1-10)

This student is on semester ${semester}, meaning they have completed semesters 1 through ${semester - 1}.
Calibrate question depth to reflect their cumulative experience, not just the current semester.

Return ONLY a valid JSON object in this exact format, with no explanation or markdown:
{
  "programme": "${programme}",
  "semester": ${semester},
  "competences": [
    {
      "name": "Short competence name (2-4 words)",
      "competenceQuestion": "Specific question about their skill level in this area (answered 1-10)",
      "interestQuestion": "Specific question about their interest in this area (answered 1-10)"
    }
  ]
}

Rules:
- Competence names should be short (2-4 words) and specific to this programme
- Questions should be specific to what ${programme} students actually study
- All output must be in English
- Only return the JSON, nothing else

Curriculum text:
${curriculumText}
`;

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { num_ctx: 4096 },
    keep_alive: '10m'
  });

  return JSON.parse(response.message.content);
}

async function generateProfileFromKnowledge(programme, semester) {
  const prompt = `
You are an academic assistant helping build a competence profile for university students.

Generate a competence profile for a student studying "${programme}" at Aalborg University,
currently on semester ${semester}.

Use your knowledge of what students typically study in this programme.
This student has completed semesters 1 through ${semester - 1}, so calibrate questions
to reflect their cumulative knowledge up to and including semester ${semester}.

Generate 6-10 competences that are highly relevant to "${programme}" students.
For each competence write one skill question and one interest question (both answered 1-10).

Return ONLY a valid JSON object in this exact format, with no explanation or markdown:
{
  "programme": "${programme}",
  "semester": ${semester},
  "competences": [
    {
      "name": "Short competence name (2-4 words)",
      "competenceQuestion": "Specific question about their skill level (answered 1-10)",
      "interestQuestion": "Specific question about their interest in this area (answered 1-10)"
    }
  ]
}

Rules:
- Competence names should be short (2-4 words) and specific to ${programme}
- Questions should reflect the level of a semester ${semester} student
- All output must be in English
- Only return the JSON, nothing else
`;

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { num_ctx: 4096 },
    keep_alive: '10m'
  });

  return JSON.parse(response.message.content);
}

export async function getCompetenceProfile(programme, semester, curriculumUrl = null, curriculumText = null) {
  const key = `${programme.toLowerCase().replace(/\s+/g, '-')}-${semester}`;
  const cachePath = path.join(CACHE_DIR, `${key}.json`);

  if (fs.existsSync(cachePath)) {
    console.log(`Using cached profile for ${key}`);
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }

  let profile;

  if (curriculumText) {
    console.log(`Generating competence profile from provided text for ${key}...`);
    profile = await generateProfileFromCurriculum(programme, semester, curriculumText.slice(0, 6000));
  } else if (curriculumUrl) {
    console.log(`Fetching curriculum for ${key} from ${curriculumUrl}...`);
    const text = await fetchCurriculum(curriculumUrl);
    console.log(`Generating competence profile from curriculum...`);
    profile = await generateProfileFromCurriculum(programme, semester, text);
  } else {
    console.log(`No curriculum source for ${key}, using LLM knowledge...`);
    profile = await generateProfileFromKnowledge(programme, semester);
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
