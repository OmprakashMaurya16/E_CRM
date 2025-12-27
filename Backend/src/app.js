const express = require("express");
const cors = require("cors");
const connectDB = require("./config/dataBase");
const authRoutes = require("./routes/auth.routes");

const app = express();
connectDB();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("E-CRM Backend is running");
});

module.exports = app;
