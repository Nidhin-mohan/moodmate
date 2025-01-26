import { Request } from "express";
import { IUser } from "../models/userModel"; 

declare global {
  namespace Express {
    interface Request {
      user?: User; // Replace `User` with your specific type, or use `any` if unsure
    }
  }
}

export {}
