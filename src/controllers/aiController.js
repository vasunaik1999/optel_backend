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
Analyze the painter and return INSIGHTS.

DATA:
- Total serials consumed: ${totalBought}
- Commission earned: ${commissionEarned}
- Commission redeemed: ${redeemedAmount}
- Pending commission: ${pendingCommission}
- Last purchase days ago: ${lastPurchaseDaysAgo}

Return STRICT JSON ONLY with the following fields:

summary                 (short insight)
suggestion              (1 helpful suggestion)
recommendedAction       (3-5 words, e.g. "Offer discount", "Send reminder")
loyaltyLevel            (High / Medium / Low)
nextPurchaseDays        (number)
motivation              (main motivator)
riskScore               (0-100)
confidenceScore         (0-1)

RULES:
- NO markdown
- NO backticks
- NO explanation
- ONLY valid JSON
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean output (remove ``` and `json`)
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let insights;

    try {
      insights = JSON.parse(text);
    } catch (err) {
      console.warn("JSON parse failed, returning raw text");
      insights = { raw: text };
    }

    res.json({
      userId,
      insights
    });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({
      error: err.message || "AI processing failed"
    });
  }
};
