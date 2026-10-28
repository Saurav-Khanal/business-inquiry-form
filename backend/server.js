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
const jwt=require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const authMiddleware=require("./middleware/authMiddleware");
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
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

app.post("/signup", async (req, res) => {
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

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    const user = await User.findOne({ email });
    console.log("LOGIN USER ID:", user._id.toString());
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
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
        token:token
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Invalid email or password",
    });
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

app.post("/inquiries",authMiddleware,async (req, res) => {
  try {
    // 3. Receive name and message from req.body
    const createdInquires = await inquiry.create({
      name: req.body.name,
      message: req.body.message,
      user:req.userId
    });
    res.status(201).json({
      message: "Inquiry created successfully",
      inquiry: createdInquires,
    });
  } catch (error) {
    res.status(500).json({
      message: "failed to create inquiry",
    });
  }
});

app.get("/inquiries",authMiddleware, async (req, res) => {
  try {
    const Allinquiry = await inquiry.find({user:req.userId});
    res.status(200).json({
      Allinquiry: Allinquiry,
    });
  } catch (err) {
    res.status(500).json({
      message: "failed to fetch queries",
    });
  }
});