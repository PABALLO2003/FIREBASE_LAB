import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";
import { getApps } from "firebase/app";


export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [firebaseReady, setFirebaseReady] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    
    try {
      setFirebaseReady(getApps().length > 0);
    } catch (e) {
      setFirebaseReady(false);
      console.error("Firebase SDK check failed:", e);
    }
  }, []);

  function showConfigHelp() {
    return (
      <div className="alert alert-warning">
        <strong>Auth configuration problem:</strong>
        <div>
          The Firebase Auth backend returned <code>auth/configuration-not-found</code>.
          Common fixes:
        </div>
        <ul>
          <li>Confirm frontend/src/firebase.js contains the exact firebaseConfig from your Firebase Console (Project settings → Your apps).</li>
          <li>Enable <strong>Email/Password</strong> in Firebase Console → Authentication → Sign-in method for the same project.</li>
          <li>If your API key has HTTP referrer restrictions, allow <code>http://localhost:3000</code> (or remove restrictions temporarily for local dev).</li>
          <li>If you changed config, restart your dev server (Ctrl+C → npm start) and reload the page.</li>
        </ul>
      </div>
    );
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setErrorCode("");
    setErrorMessage("");
    setLoading(true);

    if (!firebaseReady) {
      setErrorCode("firebase/not-ready");
      setErrorMessage("Firebase SDK not initialized (check frontend/src/firebase.js and that index.js imports it).");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/"); // success
    } catch (err) {
      console.error("signInWithEmailAndPassword error:", err);
      setErrorCode(err.code || "unknown");
      setErrorMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErrorCode("");
    setErrorMessage("");
    setLoading(true);

    if (!firebaseReady) {
      setErrorCode("firebase/not-ready");
      setErrorMessage("Firebase SDK not initialized (check frontend/src/firebase.js and that index.js imports it).");
      setLoading(false);
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && result.user) {
        
        await updateProfile(result.user, { displayName });
      }
      navigate("/");
    } catch (err) {
      console.error("createUserWithEmailAndPassword error:", err);
      setErrorCode(err.code || "unknown");
      setErrorMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520, marginTop: 40 }}>
      <h2>Sign in or Register</h2>

      {/* If firebase isn't ready, show a clear message and helpful next steps */}
      {!firebaseReady && (
        <div className="alert alert-warning">
          Firebase SDK not detected yet. Make sure:
          <ul>
            <li>frontend/src/firebase.js exists and is imported by frontend/src/index.js before rendering (you already have `import "./firebase";`).</li>
            <li>firebaseConfig in that file has the correct project values (apiKey, authDomain, projectId...).</li>
            <li>Email/Password is enabled in Firebase Console → Authentication → Sign-in method for that project.</li>
          </ul>
        </div>
      )}

      {/* Specific Firebase error (shows code + message). If it's configuration-not-found we add explicit help below */}
      {errorCode && (
        <div className="alert alert-danger">
          <strong>{errorCode}</strong>
          <div style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</div>
        </div>
      )}

      {/* Extra guidance when configuration-not-found occurs */}
      {errorCode === "auth/configuration-not-found" && showConfigHelp()}

      <form onSubmit={handleSignIn}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            required
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!firebaseReady || loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            required
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!firebaseReady || loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Display name (optional — used for reviews)</label>
          <input
            type="text"
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!firebaseReady || loading}
          />
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading || !firebaseReady}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleRegister} disabled={loading || !firebaseReady}>
            {loading ? "Processing..." : "Register"}
          </button>
        </div>
      </form>
    </div>
  );
}