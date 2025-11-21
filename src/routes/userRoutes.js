console.log("userRoutes loaded");
import express from "express";
import {
  getPendingCommission,
  redeemCommission,
  getUsersSummary,
  createUser,
  loginUser
} from "../controllers/userController.js";

console.log("userRoutes loaded");

const router = express.Router();
// Create User (admin)

router.post("/users", createUser);


// Simple Login (demo)
router.post("/login", loginUser);

// Pending Commission
router.get("/users/:userId/commission/pending", getPendingCommission);

// Redeem
router.post("/users/:userId/commission/redeem", redeemCommission);

// Users Summary for Dashboard
router.get("/users/summary", getUsersSummary);

export default router;
