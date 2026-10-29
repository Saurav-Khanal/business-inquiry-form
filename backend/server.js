require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const app = express();
const inquiry = require("./models/inquiry");
const User = require("./models/User");
app.use(express.json());
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const authMiddleware = require("./middleware/authMiddleware");
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongodb Connected");
    app.listen(3000, () => {
      console.log(`server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error", error);
  });

app.get("/", (req, res) => {
  res.send("Your backend is running");
});

app.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const existingEmail = await User.findOne({
      email,
    });
    if (existingEmail) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }
    if (password.length < 4) {
      return res.status(400).json({
        message: "The password length should be at least 4",
      });
    }
    const user = await User.create({
      name: name,
      email: email,
      password: password,
    });
    res.status(201).json({
      message: "User created successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    console.log("LOGIN USER ID:", user._id.toString());
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "Login successfull",
      user: {
        name: user.name,
        email: user.email,
        token: token,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

app.post("/inquiries", authMiddleware, async (req, res, next) => {
  try {
    
    const { name, message } = req.body;
    if (typeof name !== "string" || typeof message !== "string") {
      return res.status(400).json({
        message: "Name and message must be strings",
      });
    }
    if (!name.trim() || !message.trim()) {
      return res.status(400).json({
        message: "Name and Message both field are required",
      });
    }
    const createdInquiry = await inquiry.create({
      name,
      message,
      user: req.userId,
    });
    res.status(201).json({
      message: "Inquiry created successfully",
      inquiry: createdInquiry,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/inquiries", authMiddleware, async (req, res, next) => {
  try {
    const Allinquiry = await inquiry.find({ user: req.userId });
    res.status(200).json({
      Allinquiry: Allinquiry,
    });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Invalid data provided",
    });
    4;
  }

  return res.status(500).json({
    message: "Something went wrong on the server",
  });
});
