import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Adaptive Learning Dashboard</h1>

      <h2>
        Welcome, {user?.name || "Learner"}!
      </h2>

      <p>
        Email: {user?.email || "Loading profile..."}
      </p>

      <p>
        Your personalized learning experience starts here.
      </p>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;