import express from "express";
import cors from "cors";

import serialRoutes from "./routes/serialRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import covidRoutes from "./routes/covidRoutes.js";
import { apiKeyAuth } from "./middlewares/authMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json()); // ← use this instead of bodyParser

// Routes with API Key Authentication
app.use("/verify", apiKeyAuth, serialRoutes);
app.use("/verify", apiKeyAuth, userRoutes);
app.use("/verify", apiKeyAuth, covidRoutes);

export default app;

