import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      {user && (
        <div>
          <h2>Welcome, {user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;