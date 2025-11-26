console.log("userRoutes loaded");
import express from "express";
import {
  getPendingCommission,
  redeemCommission,
  getUsersSummary,
  createUser,
  loginUser
} from "../controllers/userController.js";
import { authenticate } from '../middlewares/authMiddleware.js';

console.log("userRoutes loaded");

const router = express.Router();
// Create User (admin)
router.post("/users",authenticate, createUser);


// Simple Login 
router.post("/login", loginUser);

// Pending Commission
router.get("/users/:userId/commission/pending",authenticate, getPendingCommission);

// Redeem
router.post("/users/:userId/commission/redeem",authenticate, redeemCommission);

// Users Summary for Dashboard
router.get("/users/summary",authenticate, getUsersSummary);

export default router;
