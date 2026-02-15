import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/authController";
import { authentication } from "../middlewares/authMiddleware";

const router = express.Router();

// Rate limit only auth routes — these are the brute-force targets.
// 20 attempts per 15 minutes per IP. After that, return 429.
// This doesn't affect /mood routes or authenticated endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/profile", authentication, getUserProfile);

export default router;
