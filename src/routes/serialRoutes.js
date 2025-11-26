console.log("serialRoutes loaded");
import express from "express";
import {
  addSerialNumber,
  checkSerialExists,
  consumeSerial,
  getStockSummary
} from "../controllers/serialController.js";
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Add Serial Number
router.post("/serial-numbers",authenticate, addSerialNumber);

// Check Serial Existence
router.get("/serial-numbers/:serialNumber",authenticate, checkSerialExists);

// Consume Serial Number // Mark as bought
router.post("/consume",authenticate, consumeSerial);

// Stock Summary
router.get("/stock-summary",authenticate, getStockSummary);

export default router;
