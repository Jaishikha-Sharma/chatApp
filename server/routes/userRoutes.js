import express from "express";
import {
  checkAuth,
  login,
  signup,
  updateProfile,
  approveChat,
  getAllUsers,
  createUserByAdmin
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.post("/approve-chat", protectRoute, approveChat); 
userRouter.get("/all", protectRoute, getAllUsers);
userRouter.post("/admin/create-user", protectRoute, createUserByAdmin);



export default userRouter;
