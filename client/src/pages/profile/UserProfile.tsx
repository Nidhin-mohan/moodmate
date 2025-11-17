import { useAuth } from "@/context/AuthContext";

export default function UserProfile() {
  const { isLoggedIn } = useAuth(); // Assuming your AuthContext provides a `isLoggedIn` object

  if (!isLoggedIn) {
    return (
      <div>
        <h1>User Profile</h1>
        <p>No isLoggedIn logged in.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>User Profile</h1>
      <p><strong>Name:</strong> {isLoggedIn}</p>
      <p><strong>Email:</strong> {isLoggedIn}</p>
      <p><strong>Role:</strong> {isLoggedIn}</p>
    </div>
  );
}
