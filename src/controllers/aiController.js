import prisma from "../prisma.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------------------------------
// AI Painter Insights
// ---------------------------------------------
export const getPainterInsights = async (req, res) => {
  try {
    const userId = parseInt(req.body.userId);

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    // Fetch painter data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        consumedSerials: true,
        commissions: true,
        redemptions: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalBought = user.consumedSerials.length;

    const commissionEarned = user.commissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0
    );

    const redeemedAmount = user.redemptions.reduce(
      (sum, r) => sum + r.amount,
      0
    );

    const pendingCommission = commissionEarned - redeemedAmount;

    const lastPurchaseDate = user.consumedSerials
      .sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt))[0]
      ?.consumedAt;

    const lastPurchaseDaysAgo = lastPurchaseDate
      ? Math.floor((Date.now() - new Date(lastPurchaseDate)) / (1000 * 60 * 60 * 24))
      : null;

    // Gemini Prompt
    const prompt = `
You are an AI assistant for a paint company's painter loyalty program.
Analyze the following painter data and generate insights.

Data:
- Total serials consumed: ${totalBought}
- Total commission earned: ₹${commissionEarned}
- Total redeemed: ₹${redeemedAmount}
- Pending commission: ₹${pendingCommission}
- Last purchase days ago: ${lastPurchaseDaysAgo}

Return output STRICTLY in JSON with keys:
summary
suggestion
nextPurchasePrediction
motivation
riskScore (0-100)

Make it short and helpful.
    `;

    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let insights;
    try {
      insights = JSON.parse(text);
    } catch {
      insights = { raw: text };
    }

    res.json({ userId, insights });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({
      error: err.message || "AI processing failed"
    });
  }
};
