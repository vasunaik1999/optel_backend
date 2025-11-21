import prisma from "../prisma.js";

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
export const createUser = async (req, res) => {
  try {
    console.log("createUser hit!", req.body);

    const { name } = req.body;

    // Let Prisma auto-generate ID
    const created = await prisma.user.create({
      data: { name: name || null }
    });

    res.json({ success: true, user: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Login (demo passwordless)
// ---------------------------------------------
export const loginUser = async (req, res) => {
  try {
    const userId = parseInt(req.body.userId); // convert to int
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
