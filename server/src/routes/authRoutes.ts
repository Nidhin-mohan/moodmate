import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/authController";
import { authentication } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authentication, getUserProfile);

export default router;
