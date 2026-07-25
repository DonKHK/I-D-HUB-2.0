const express = require('express');
const router = express.Router();
const ideaService = require('../services/ideaService');

// GET /api/ideas — fetch all ideas
router.get('/', (req, res) => {
  try {
    const ideas = ideaService.readIdeas();
    res.json(ideas);
  } catch (e) {
    console.error('[routes/ideas] GET error:', e.message);
    res.status(500).json({ error: 'Failed to read ideas' });
  }
});

// GET /api/ideas/:id — fetch single idea
router.get('/:id', (req, res) => {
  try {
    const idea = ideaService.getIdeaById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json(idea);
  } catch (e) {
    console.error('[routes/ideas] GET by id error:', e.message);
    res.status(500).json({ error: 'Failed to get idea' });
  }
});

// POST /api/ideas — create new idea
router.post('/', (req, res) => {
  try {
    const newIdea = ideaService.addIdea(req.body);
    res.status(201).json(newIdea);
  } catch (e) {
    console.error('[routes/ideas] POST error:', e.message);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

// PUT /api/ideas/:id — update idea
router.put('/:id', (req, res) => {
  try {
    const updated = ideaService.updateIdea(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Idea not found' });
    res.json(updated);
  } catch (e) {
    console.error('[routes/ideas] PUT error:', e.message);
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

// DELETE /api/ideas/:id — hard delete idea
router.delete('/:id', (req, res) => {
  try {
    const deleted = ideaService.deleteIdea(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true, message: 'Idea deleted' });
  } catch (e) {
    console.error('[routes/ideas] DELETE error:', e.message);
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

module.exports = router;