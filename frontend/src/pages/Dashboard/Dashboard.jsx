
import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api/behaviour/events";
const SESSION_API_URL = "http://localhost:5000/api/behaviour/sessions";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const startTime = useRef(0);
  const cleanupTimer = useRef(null);
  const pageViewSent = useRef(false);
  const sessionPromise = useRef(null);

  useEffect(() => {
    // Cancel pending cleanup during React Strict Mode re-runs.
    if (cleanupTimer.current !== null) {
      clearTimeout(cleanupTimer.current);
      cleanupTimer.current = null;
    }

    startTime.current = performance.now();

    // Capture the page URL and JWT for this page visit.
    const pageUrl = window.location.pathname;
    const token = localStorage.getItem("token");

    // Create a real database session and reuse its ID
    // for all behaviour events in this component instance.
    const getSessionId = async () => {
      if (!token) {
        throw new Error("JWT token not found.");
      }

      if (!sessionPromise.current) {
        sessionPromise.current = (async () => {
          const response = await fetch(SESSION_API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.message || "Failed to create session"
            );
          }

          const sessionId = result.data?.session_id;

          if (
            !Number.isSafeInteger(sessionId) ||
            sessionId <= 0
          ) {
            throw new Error(
              "Backend returned an invalid session ID."
            );
          }

          console.log("Database session created:", sessionId);

          return sessionId;
        })();
      }

      return sessionPromise.current;
    };

    const recordEvent = async (
      eventType,
      durationSeconds = 0
    ) => {
      if (!token) {
        console.warn(
          "Behaviour event skipped: JWT token not found."
        );
        return;
      }

      try {
        // Wait until MySQL has created the session.
        const sessionId = await getSessionId();

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: eventType,
            page_url: pageUrl,
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
          console.error(
            "Behaviour tracking failed:",
            result
          );
          return;
        }

        console.log(
          `Behaviour event recorded: ${eventType}`,
          result
        );
      } catch (error) {
        console.error(
          `Failed to process ${eventType}:`,
          error.message
        );
      }
    };

    // Record one page_view per component instance.
    if (!pageViewSent.current) {
      pageViewSent.current = true;
      recordEvent("page_view");
    }

    return () => {
      // Allow Strict Mode's immediate cleanup to be cancelled.
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

      <h2>Welcome, {user?.name || "Learner"}!</h2>

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
