const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'ideas.json');

/**
 * Read all ideas from the JSON file.
 * If the file doesn't exist yet, create it from sample data.
 */
function readIdeas() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      // First run — seed from sampleIdeas
      const { sampleIdeas } = require('../data/sampleIdeas');
      const seeded = sampleIdeas.map((idea) => ({
        ...idea,
        id: idea.id || `IDEA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        createdAt: idea.createdAt || new Date().toISOString(),
      }));
      fs.writeFileSync(DATA_PATH, JSON.stringify(seeded, null, 2), 'utf8');
      console.log(`[ideaService] Seeded ${seeded.length} ideas to ideas.json`);
      return seeded;
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[ideaService] Error reading ideas.json:', e.message);
    return [];
  }
}

/**
 * Write the full ideas array back to the JSON file.
 */
function writeIdeas(ideas) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(ideas, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[ideaService] Error writing ideas.json:', e.message);
    return false;
  }
}

/**
 * Get a single idea by id.
 */
function getIdeaById(id) {
  const ideas = readIdeas();
  return ideas.find((i) => i.id === id) || null;
}

/**
 * Update a single idea by id (merge fields).
 */
function updateIdea(id, updates) {
  const ideas = readIdeas();
  const index = ideas.findIndex((i) => i.id === id);
  if (index === -1) return null;
  ideas[index] = { ...ideas[index], ...updates, updatedAt: new Date().toISOString() };
  writeIdeas(ideas);
  return ideas[index];
}

/**
 * Add a new idea.
 */
function addIdea(idea) {
  const ideas = readIdeas();
  const newIdea = {
    ...idea,
    id: idea.id || `IDEA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    createdAt: idea.createdAt || new Date().toISOString(),
    status: idea.status || 'pending',
  };
  ideas.unshift(newIdea);
  writeIdeas(ideas);
  return newIdea;
}

/**
 * Delete an idea by id (hard delete).
 */
function deleteIdea(id) {
  const ideas = readIdeas();
  const filtered = ideas.filter((i) => i.id !== id);
  if (filtered.length === ideas.length) return false;
  writeIdeas(filtered);
  return true;
}

module.exports = { readIdeas, writeIdeas, getIdeaById, updateIdea, addIdea, deleteIdea };