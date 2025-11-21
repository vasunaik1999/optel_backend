console.log("serialRoutes loaded");
import express from "express";
import {
  addSerialNumber,
  checkSerialExists,
  consumeSerial,
  getStockSummary
} from "../controllers/serialController.js";

const router = express.Router();

// Add Serial Number
router.post("/serial-numbers", addSerialNumber);

// Check Serial Existence
router.get("/serial-numbers/:serialNumber", checkSerialExists);

// Consume Serial Number
router.post("/consume", consumeSerial);

// Stock Summary
router.get("/stock-summary", getStockSummary);

export default router;
