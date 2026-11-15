import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react";

import api from "../services/api";


function Login() {

  // ============================================================
  // STATE
  // ============================================================

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigate = useNavigate();


  // ============================================================
  // HANDLE LOGIN
  // ============================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    setLoading(true);


    try {

      // --------------------------------------------------------
      // Send login request to FastAPI
      // --------------------------------------------------------

      const response = await api.post(
        "/auth/login",
        {
          email: email,
          password: password,
        }
      );


      console.log(
        "Login response:",
        response.data
      );


      // --------------------------------------------------------
      // Get token
      // --------------------------------------------------------

      const accessToken =
        response.data.access_token;


      // --------------------------------------------------------
      // Get logged-in user
      // --------------------------------------------------------

      const user =
        response.data.user;


      // --------------------------------------------------------
      // Save authentication information
      // --------------------------------------------------------

      localStorage.setItem(
        "access_token",
        accessToken
      );


      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      // --------------------------------------------------------
      // Redirect according to role
      // --------------------------------------------------------

      if (user.role === "admin") {

        navigate(
          "/admin/dashboard"
        );

      } else if (user.role === "agent") {

        navigate(
          "/agent/dashboard"
        );

      } else if (user.role === "customer") {

        navigate(
          "/customer/dashboard"
        );
      } else {

        setError(
          "Invalid user role"
        );
        localStorage.removeItem(
          "access_token"
        );
        localStorage.removeItem(
          "user"
        );
      }

      // --------------------------------------------------------
      // Show backend error
      // --------------------------------------------------------

      setError(
        error.response?.data?.detail ||
        "Invalid email or password"
      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="login-page">

      <div className="login-card">


        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="login-header">

          <div className="logo-icon">

            <Headphones size={28} />

          </div>


          <h1>
            AI Support
          </h1>


          <p>
            Welcome back! Sign in to manage your
            support tickets.
          </p>

        </div>


        {/* ======================================================
            ERROR MESSAGE
            ====================================================== */}

        {error && (

          <div className="login-error">

            {error}

          </div>

        )}


        {/* ======================================================
            LOGIN FORM
            ====================================================== */}

        <form
          onSubmit={handleSubmit}
        >


          {/* ====================================================
              EMAIL
              ==================================================== */}

          <div className="form-group">

            <label>
              Email Address
            </label>


            <div className="input-wrapper">

              <Mail size={19} />


              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

          </div>


          {/* ====================================================
              PASSWORD
              ==================================================== */}

          <div className="form-group">

            <label>
              Password
            </label>


            <div className="input-wrapper">

              <Lock size={19} />


              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />


              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >

                {showPassword ? (

                  <EyeOff size={19} />

                ) : (

                  <Eye size={19} />

                )}

              </button>

            </div>

          </div>


          {/* ====================================================
              OPTIONS
              ==================================================== */}

          <div className="login-options">

            <label className="remember-me">

              <input
                type="checkbox"
              />

              Remember me

            </label>


            <button
              type="button"
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>

          </div>


          {/* ====================================================
              LOGIN BUTTON
              ==================================================== */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Signing In..."
              : "Sign In"
            }

          </button>


        </form>


        {/* ======================================================
            REGISTER LINK
            ====================================================== */}

        <div className="register-link">

          Don't have an account?

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
          >
            Create Account
          </button>

        </div>


      </div>

    </div>

  );

}


export default Login;