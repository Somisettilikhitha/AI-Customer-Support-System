import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });

      setMessage(
        response.data.message || "Password reset successful."
      );

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "15px",
    color: "#111827",
    backgroundColor: "#ffffff",
    outlineColor: "#2563eb",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          boxSizing: "border-box",
          padding: "32px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          boxShadow: "0 8px 28px rgba(0, 0, 0, 0.08)",
          color: "#111827",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2
            style={{
              fontSize: "27px",
              fontWeight: "700",
              margin: "0 0 10px",
              color: "#111827",
            }}
          >
            Reset Your Password
          </h2>

          <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
            Enter a new password for your account.
          </p>
        </div>

        {!token && (
          <p
            role="alert"
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            Reset token is missing. Please request a new reset link.
          </p>
        )}

        {message && (
          <p
            role="status"
            style={{
              color: "#166534",
              backgroundColor: "#f0fdf4",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <label
              htmlFor="new-password"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: "100%",
              padding: "13px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "7px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading || !token ? "not-allowed" : "pointer",
              opacity: loading || !token ? 0.65 : 1,
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            marginBottom: 0,
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Remember your password?{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;