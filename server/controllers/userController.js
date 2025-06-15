import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";

const validRoles = ["Admin", "Employee", "Project Coordinator", "Freelancer", "Customer"];

// ✅ Signup controller
export const signup = async (req, res) => {
  try {
    const fullName = req.body.fullName?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const bio = req.body.bio?.trim();
    const role = req.body.role?.trim();

    // Check for missing fields
    if (!fullName || !email || !bio || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details" });
    }

    // Check for valid role
    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Account already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
      role,
      approvedToChat: [],
    });

    const token = generateToken(newUser._id);

    // Remove password before sending response
    const { password: _p, ...userWithoutPassword } = newUser._doc;

    res.status(201).json({
      success: true,
      userData: userWithoutPassword,
      token,
      message: "Account created successfully!",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Login controller
export const login = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }

    const userData = await User.findOne({ email });

    if (!userData) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);
    const { password: _p, ...userWithoutPassword } = userData._doc;

    res.status(200).json({
      success: true,
      userData: userWithoutPassword,
      token,
      message: "Login successfully!",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Check if user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// ✅ Update profile
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;

    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Admin approves chat between 2 users
export const approveChat = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { userIdToApprove, targetUserId } = req.body;

    const admin = await User.findById(adminId);
    if (admin.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only Admin can approve chats." });
    }

    // Approve both ways
    await User.findByIdAndUpdate(userIdToApprove, {
      $addToSet: { approvedToChat: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { approvedToChat: userIdToApprove },
    });

    return res.json({ success: true, message: "Users approved to chat." });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Users — only for Admin
export const getAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let users = [];

    // Admin & Project Coordinator => see all users
    if (["Admin", "Project Coordinator"].includes(currentUser.role)) {
      users = await User.find({ _id: { $ne: currentUser._id } }).select("-password");
    } else {
      // Other roles => show only users they've messaged with or received messages from
      const sent = await Message.find({ senderId: currentUser._id }).distinct("receiverId");
      const received = await Message.find({ receiverId: currentUser._id }).distinct("senderId");

      const userIds = Array.from(new Set([...sent, ...received])); // unique list
      users = await User.find({ _id: { $in: userIds } }).select("-password");
    }

    res.json({ success: true, users });
  } catch (error) {
    console.log("getAllUsers error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};