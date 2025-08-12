# ---------- Step 1: Build the TypeScript app ----------
    FROM node:20-alpine AS build
    WORKDIR /app
    
    # Copy package files and install dependencies
    COPY package*.json ./
    RUN npm install
    
    # Copy the rest of the source code
    COPY . .
    
    # Build TypeScript -> JavaScript
    RUN npm run build
    
    
    # ---------- Step 2: Run the compiled JS (production) ----------
    FROM node:20-alpine
    WORKDIR /app
    
    # Only copy built code and node_modules (lean image)
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/node_modules ./node_modules
    COPY --from=build /app/package*.json ./
    
    # Expose port used by the Express app
    EXPOSE 5000
    
    # Start the compiled app
    CMD ["node", "dist/index.js"]
    