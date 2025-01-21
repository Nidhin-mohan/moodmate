import { Button, Card } from "../components/ui"; // Importing only Button and Card
import { Link } from "react-router-dom"; // Import Link from react-router-dom

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 via-indigo-700 to-purple-900 text-gray-200">
      <Card className="max-w-lg p-8 shadow-xl rounded-xl bg-white/10 backdrop-blur-lg">
        <h1 className="text-5xl font-serif font-bold text-center mb-6 text-indigo-400">
          Welcome to MoodMate
        </h1>
        <p className="text-center text-lg mb-6 text-gray-300">
          Your partner in mental health and well-being. Log in to explore more.
        </p>

        {/* Info Section */}
        <div className="bg-white/20 p-6 rounded-lg shadow-lg">
          <h3 className="text-3xl font-semibold text-center text-gray-300 mb-4">
            Take the first step towards your well-being
          </h3>
          <p className="text-center text-gray-300 mb-6">
            Connect with yourself and take steps toward better mental health and
            well-being with MoodMate.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-indigo-300 hover:bg-indigo-800 focus:ring focus:ring-indigo-300 rounded-full py-2 px-6"
            >
              <Link to="/login">Log In</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto text-indigo-300 hover:bg-indigo-800 focus:ring focus:ring-indigo-300 rounded-full py-2 px-6"
            >
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>

        {/* Explore Link */}
        <div className="mt-6 text-center">
          <Link
            to="/o"
            className="text-indigo-400 hover:underline text-lg transition duration-300 ease-in-out"
          >
            Explore MoodMate
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Home;
