import express from "express";
import cors from "cors";

import serialRoutes from "./routes/serialRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json()); // ← use this instead of bodyParser

// Routes
app.use("/verify", serialRoutes);
app.use("/verify", userRoutes);

export default app;

