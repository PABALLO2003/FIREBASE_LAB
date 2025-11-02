import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";

function Header() {
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setName(u.displayName || u.email || "");
        localStorage.removeItem("displayName");
      } else {
        const stored = localStorage.getItem("displayName") || "";
        setName(stored);
      }
    });
    return () => unsub();
  }, []);

  async function handleSetName() {
    const newName = prompt("Enter a display name (used for reviews):", name || "");
    if (newName === null) return;

    if (user) {
      try {
        await updateProfile(user, { displayName: newName });
        setName(newName);
      } catch (err) {
        console.error("Failed to update displayName:", err);
        alert("Failed to update display name: " + (err.message || err));
      }
    } else {
      localStorage.setItem("displayName", newName);
      setName(newName);
    }
  }

  async function handleLogout() {
    if (user) {
      try {
        await signOut(auth);
        setUser(null);
        setName("");
        navigate("/");
      } catch (err) {
        console.error("Sign out failed:", err);
        alert("Sign out failed: " + (err.message || err));
      }
    } else {
      localStorage.removeItem("displayName");
      setName("");
      navigate("/");
    }
  }

  function goToSignIn() {
    navigate("/signin");
  }

  const headerStyle = {
    backgroundColor: "#0d6efd", 
    color: "#ffffff",           
    padding: "0.75rem 0",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
  };

  return (
    <nav className="navbar navbar-expand-lg" style={headerStyle}>
      <div className="container">
        <Link className="navbar-brand text-white" to="/">MovieReviews</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link text-white" to="/browse">Browse</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/my-reviews">My Reviews</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/about">About</Link></li>
          </ul>

          <div className="d-flex align-items-center">
            {name ? (
              <>
                <span className="text-white me-2">Signed in as <strong>{name}</strong></span>
                <button className="btn btn-sm btn-outline-light me-2" onClick={handleSetName}>Change</button>
                <button className="btn btn-sm btn-outline-warning" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <button className="btn btn-sm btn-outline-light" onClick={goToSignIn}>Sign in</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;