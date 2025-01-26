// constants/httpStatusCodes.js

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

export const MESSAGES = {
  // General
  SUCCESS: "Request successful",
  INTERNAL_ERROR: "Internal server error",
  INVALID_REQUEST: "Invalid request parameters",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access is forbidden",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Conflict in request",
  UNPROCESSABLE_ENTITY: "Validation failed",

  // Authentication
  LOGIN_SUCCESS: "Login successful",
  LOGIN_FAILED: "Invalid credentials",
  LOGOUT_SUCCESS: "Logout successful",
  TOKEN_EXPIRED: "Authentication token has expired",
  UNAUTHORIZED_ACCESS: "You are not authorized to perform this action",

  // User Management
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  USER_RETRIEVED: "User retrieved successfully",
  USER_NOT_FOUND: "User not found",

  // Items/Resources
  ITEM_CREATED: "Item created successfully",
  ITEM_UPDATED: "Item updated successfully",
  ITEM_DELETED: "Item deleted successfully",
  ITEM_RETRIEVED: "Item retrieved successfully",
  ITEM_NOT_FOUND: "Item not found",

  // Data
  DATA_CREATED: "Data created successfully",
  DATA_UPDATED: "Data updated successfully",
  DATA_DELETED: "Data deleted successfully",
  DATA_RETRIEVED: "Data retrieved successfully",

  // Validation
  MISSING_FIELDS: "Required fields are missing",
  INVALID_DATA: "Invalid data provided",
  VALIDATION_ERROR: "Validation error occurred",

  // File Handling
  FILE_UPLOADED: "File uploaded successfully",
  FILE_DELETED: "File deleted successfully",
  FILE_TOO_LARGE: "File size exceeds the allowed limit",
  UNSUPPORTED_FILE_TYPE: "Unsupported file type",

  // Operations
  ACTION_SUCCESSFUL: "Action completed successfully",
  ACTION_FAILED: "Action failed",
  RESOURCE_CREATED: "Resource created successfully",
  RESOURCE_UPDATED: "Resource updated successfully",
  RESOURCE_DELETED: "Resource deleted successfully",

  // Custom Messages
  PASSWORD_RESET_SUCCESS: "Password reset successful",
  PASSWORD_RESET_FAILED: "Password reset failed",
  EMAIL_VERIFIED: "Email verified successfully",
  EMAIL_SENT: "Verification email sent successfully",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
};
