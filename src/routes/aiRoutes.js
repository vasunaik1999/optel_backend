// src/routes/aiRoutes.js
console.log("AI Routes loaded");
import express from 'express';
import { getPainterInsights } from '../controllers/aiController.js';

const router = express.Router();

router.post('/ai/insights', getPainterInsights);

export default router;

