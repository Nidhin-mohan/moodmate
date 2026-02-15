import { IUser } from "../models/userModel";

// This augments Express's built-in Request type globally.
// After this, req.user is typed as IUser | undefined everywhere —
// which means TypeScript knows about .name, .email, ._id, .role
// and will catch typos like req.user.emial at compile time.

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
