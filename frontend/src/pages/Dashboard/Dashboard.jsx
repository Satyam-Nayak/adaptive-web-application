
import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api/behaviour/events";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const startTime = useRef(0);
  const cleanupTimer = useRef(null);
  const pageViewSent = useRef(false);

  useEffect(() => {
    // Cancel a pending cleanup during React Strict Mode's
    // development-only effect re-run.
    if (cleanupTimer.current !== null) {
      clearTimeout(cleanupTimer.current);
      cleanupTimer.current = null;
    }

    startTime.current = performance.now();

    // Capture the token while the user is authenticated.
    const token = localStorage.getItem("token");

    const recordEvent = async (eventType, durationSeconds = 0) => {
      if (!token) {
        console.warn(
          "Behaviour event skipped: JWT token not found."
        );
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            event_type: eventType,
            page_url: window.location.pathname,
            event_data: {
              page_name: "Adaptive Learning Dashboard",
              source: "frontend_auto",
            },
            duration_seconds: durationSeconds,
          }),
          keepalive: true,
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("Behaviour tracking failed:", result);
          return;
        }

        console.log(
          `Behaviour event recorded: ${eventType}`,
          result
        );
      } catch (error) {
        console.error("Behaviour tracking error:", error);
      }
    };

    // Send only one page_view during the Strict Mode effect cycle.
    if (!pageViewSent.current) {
      pageViewSent.current = true;
      recordEvent("page_view");
    }

    return () => {
      // Delay cleanup briefly so Strict Mode's immediate
      // development cleanup can be cancelled by the next setup.
      cleanupTimer.current = setTimeout(() => {
        const durationSeconds = Math.floor(
          (performance.now() - startTime.current) / 1000
        );

        recordEvent("page_exit", durationSeconds);
        cleanupTimer.current = null;
      }, 0);
    };
  }, []);

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
