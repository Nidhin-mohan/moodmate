import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>
        <h1>401 - Unauthorized</h1>
        <p>You are not authorized to access this page.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    </div>
  );
}
