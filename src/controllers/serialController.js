import prisma from "../prisma.js";
import { calculateCommission } from "../services/commissionService.js";

// ---------------------------------------------
// Add Serial Number
// ---------------------------------------------
export const addSerialNumber = async (req, res) => {
  try {
    const { serialNumber, mrp } = req.body;

    const existing = await prisma.serialNumber.findUnique({
      where: { serialNumber }
    });

    if (existing) {
      return res.status(400).json({ message: "Serial already exists" });
    }

    const created = await prisma.serialNumber.create({
      data: {
        serialNumber,
        mrp: parseFloat(mrp)
      }
    });

    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Check Serial Exists
// ---------------------------------------------
export const checkSerialExists = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    const serial = await prisma.serialNumber.findUnique({
      where: { serialNumber }
    });

    if (!serial) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      mrp: serial.mrp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Consume Serial Number
// ---------------------------------------------
export const consumeSerial = async (req, res) => {
  try {
    const { userId, serialNumber } = req.body;

    const serial = await prisma.serialNumber.findUnique({
      where: { serialNumber }
    });

    if (!serial) {
      return res.status(404).json({
        success: false,
        message: "Serial does not exist"
      });
    }

    if (serial.isConsumed) {
      return res.status(400).json({
        success: false,
        message: "Already consumed"
      });
    }

    // Mark consumed
    const updated = await prisma.serialNumber.update({
      where: { id: serial.id },
      data: {
        isConsumed: true,
        consumedBy: { connect: { id: parseInt(userId) } },
        consumedAt: new Date()
      }
    });

    // Calculate commission
    const commissionAmount = calculateCommission(serial.mrp);

    await prisma.commissionTransaction.create({
      data: {
        userId: parseInt(userId),
        serialId: serial.id,
        commissionAmount
      }
    });

    res.json({
      success: true,
      message: "Consumed successfully",
      commissionEarned: commissionAmount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------
// Stock Summary
// ---------------------------------------------
export const getStockSummary = async (req, res) => {
  try {
    const inStock = await prisma.serialNumber.count({
      where: { isConsumed: false }
    });

    const consumed = await prisma.serialNumber.count({
      where: { isConsumed: true }
    });

    res.json({ inStock, consumed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
