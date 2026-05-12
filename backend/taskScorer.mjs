import ollama from 'ollama';

export async function validateTask(taskDescription) {
  const trimmed = taskDescription.trim();

  if (trimmed.length < 5) {
    return { valid: false, reason: 'Task description is too short' };
  }

  const blocklist = ['war crime', 'kill', 'murder', 'drug', 'weapon', 'bomb', 'hack', 'illegal'];
  const lower = trimmed.toLowerCase();
  const blocked = blocklist.find(word => lower.includes(word));
  if (blocked) {
    return { valid: false, reason: 'This task is not appropriate for a university group project' };
  }

  return { valid: true, reason: 'Task is valid' };
}

export async function scoreTask(taskDescription, competences) {
  const validation = await validateTask(taskDescription);
  if (!validation.valid) {
    throw new Error(`INVALID_TASK: ${validation.reason}`);
  }

  const prompt = `Score this task for each competence 1-10. Return JSON only.

Task: "${taskDescription}"

Competences: ${competences.join(', ')}

Return: {"competence name": score, ...}`;

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [{ role: 'user', content: prompt }],
    format: 'json',
    options: { num_ctx: 1024 }
  });

  const raw = response.message.content;

  try {
    const scores = JSON.parse(raw);

    for (const c of competences) {
      if (!(c in scores)) scores[c] = 1;
    }

    const filtered = {};
    for (const [competence, score] of Object.entries(scores)) {
      if (score >= 3) filtered[competence] = score;
    }

    if (Object.keys(filtered).length === 0) {
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      for (const [competence, score] of sorted.slice(0, 3)) {
        filtered[competence] = score;
      }
    }

    return filtered;
  } catch (err) {
    throw new Error(`Failed to parse task scores: ${err.message}\nRaw: ${raw}`);
  }
}

export async function scoreTasksBatch(tasks, competences) {
  const results = await Promise.all(
    tasks.map(task =>
      scoreTask(task.description, competences)
        .then(scores => ({ taskId: task.id, description: task.description, taskScores: scores }))
        .catch(err => ({ taskId: task.id, description: task.description, taskScores: null, error: err.message }))
    )
  );
  return results;
}
