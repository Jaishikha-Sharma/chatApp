import express from "express";
import {
  checkAuth,
  login,
  signup,
  updateProfile,
  approveChat,
  getAllUsers
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.post("/approve-chat", protectRoute, approveChat); 
userRouter.get("/all", protectRoute, getAllUsers);



export default userRouter;
