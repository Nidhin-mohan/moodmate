import { HTTP_STATUS, MESSAGES } from "../constants/httpStatusCodes";
import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, loginSchema } from "../validations/userValidation";
import {
  registerUserService,
  loginUserService,
  getUserProfileService,
} from "../services/authService";

export const registerUser = asyncHandler("User Registration", async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const userData = await registerUserService(name, email, password);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: MESSAGES.USER_CREATED,
    data: userData,
  });
});

export const loginUser = asyncHandler("User Login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const userData = await loginUserService(email, password);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.LOGIN_SUCCESS,
    data: userData,
  });
});

export const getUserProfile = asyncHandler("Get User Profile", async (req, res) => {
  const userId = req.user!._id.toString();
  const userData = await getUserProfileService(userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.USER_RETRIEVED,
    data: userData,
  });
});
