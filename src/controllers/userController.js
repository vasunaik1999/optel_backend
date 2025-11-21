import prisma from "../prisma.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// ---------------------------------------------
// Get Pending Commission
// ---------------------------------------------
export const getPendingCommission = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId); // convert to int

    const pending = await prisma.commissionTransaction.aggregate({
      _sum: { commissionAmount: true },
      where: { userId }
    });

    const claimed = await prisma.commissionRedemption.aggregate({
      _sum: { amount: true },
      where: { userId }
    });

    const pendingAmount =
      (pending._sum.commissionAmount || 0) -
      (claimed._sum.amount || 0);

    res.json({ pendingCommission: pendingAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Redeem Commission
// ---------------------------------------------
export const redeemCommission = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId); // convert to int
    const { pointsToRedeem } = req.body;

    const pending = await prisma.commissionTransaction.aggregate({
      _sum: { commissionAmount: true },
      where: { userId }
    });

    const claimed = await prisma.commissionRedemption.aggregate({
      _sum: { amount: true },
      where: { userId }
    });

    const pendingAmount =
      (pending._sum.commissionAmount || 0) -
      (claimed._sum.amount || 0);

    if (pointsToRedeem > pendingAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient pending points"
      });
    }

    const redemption = await prisma.commissionRedemption.create({
      data: {
        userId,
        amount: pointsToRedeem
      }
    });

    res.json({
      success: true,
      message: "Redeemed successfully",
      redeemedAmount: redemption.amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Users Summary (Dashboard)
// ---------------------------------------------
export const getUsersSummary = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        commissions: true,
        redemptions: true,
        consumedSerials: true
      }
    });

    const result = users.map(u => {
      const totalSold = u.consumedSerials.length;
      const claimed = u.redemptions.reduce((acc, r) => acc + r.amount, 0);
      const pending = u.commissions.reduce((acc, t) => acc + t.commissionAmount, 0) - claimed;

      return {
        userId: u.id,
        totalSold,
        claimedCommission: claimed,
        pendingCommission: pending
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Create User (simple)
// ---------------------------------------------
// ---------------------------------------------
// Create User (with hashed password + JWT)
// ---------------------------------------------
export const createUser = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const created = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: created.id, name: created.name },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" } // token valid for 7 days
    );

    res.json({
      success: true,
      user: { id: created.id, name: created.name },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------------------------
// Login (demo passwordless)
// ---------------------------------------------
export const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body
    if (!userId || !password)
      return res.status(400).json({ success: false, message: 'User ID and password required' })

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const validPassword = await bcrypt.compare(password, user.password || '')
    if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid password' })

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.json({ 
      success: true, 
      user: { id: user.id, name: user.name },
      token
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}