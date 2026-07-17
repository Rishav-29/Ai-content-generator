const express = require('express');
const router = express.Router();
const { generateContent } = require('../controllers/generateController');

// POST /api/generate
router.post('/', generateContent);

module.exports = router;
