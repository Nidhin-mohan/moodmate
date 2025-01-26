import "dotenv/config"
import app from "./app";
import { connectDB } from "./config/db";


const PORT = process.env.PORT || 5000;


// Start server and connect to DB
app.listen(PORT, async () => {

  await connectDB();

  console.log(`Server running on http://localhost:${PORT}`);
});
