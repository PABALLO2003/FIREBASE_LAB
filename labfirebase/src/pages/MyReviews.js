import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      if (authLoading) return;
      setLoading(true);
      setError(null);

      if (!user) {
        setError("No signed-in user found.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        console.log("🔍 Fetching reviews from backend...");
        
        const response = await fetch(`${BACKEND}/api/my-reviews`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const msg = `Error: ${response.status} ${response.statusText}`;
          setError(msg);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("✅ Reviews data received:", data);
        setReviews(data);
      } catch (err) {
        console.error("❌ Error loading reviews:", err);
        setError(`Failed to connect to backend: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, user]);

  const handleEdit = (review) => {
    console.log("✏️ Editing review:", review);
  
    navigate(`/review/${review.movieId}/edit/${review.id}`);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${BACKEND}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (err) {
      setError(String(err));
    }
  };

  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    try {
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleDateString();
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      return "Recently";
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getReviewText = (review) => {
    return review.text || review.content || "No review text provided";
  };

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <h1>My Reviews</h1>
        <p>Loading your reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>My Reviews</h1>
        <p style={{ color: "crimson" }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '10px', padding: '5px 10px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <h1>My Reviews ({reviews.length})</h1>
      <div className="reviews-inner-container">
        {reviews.length ? (
          <ul className="reviews-list">
            {reviews.map((r) => (
              <li key={r.id} className="review-item">
                <div className="review-header">
                  <strong>{r.movieTitle || `Movie ID: ${r.movieId}`}</strong>
                  <div className="review-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(r)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="rating">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={index} role="img" aria-label="star">
                      {index < (r.rating || 0) ? "⭐" : "☆"}
                    </span>
                  ))}
                  <span className="rating-text">{` ${r.rating || 0}/5`}</span>
                </div>
                <p className="review-text">{getReviewText(r)}</p>
                <small className="review-date">
                  Posted on: {formatFirestoreDate(r.createdAt)}
                </small>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: '#999', 
                  marginTop: '5px',
                  fontFamily: 'monospace'
                }}>
                  ID: {r.id} | Movie: {r.movieId}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-reviews">
            <p>No reviews yet. Go watch some movies and write reviews!</p>
            <button 
              onClick={() => navigate("/")}
              style={{ marginTop: '10px', padding: '8px 16px' }}
            >
              Browse Movies
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .reviews-container {
          max-width: 800px;
          margin: auto;
          padding: 20px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        h1 {
          color: #0B2D40; 
          text-align: center; 
        }

        .reviews-inner-container {
          margin-top: 1rem; 
        }

        .reviews-list {
          list-style-type: none; 
          padding: 0;
        }

        .review-item {
          background-color: #C9E9FC; 
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 5px; 
          transition: background-color 0.3s; 
          border: 1px solid #a0d2f5;
        }

        .review-item:hover {
          background-color: #F4BFFA; 
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .review-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          padding: 0.25rem 0.5rem;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .edit-btn {
          background-color: #4CAF50;
          color: white;
        }

        .edit-btn:hover {
          background-color: #45a049;
        }

        .delete-btn {
          background-color: #f44336;
          color: white;
        }

        .delete-btn:hover {
          background-color: #da190b;
        }

        .rating {
          display: flex;
          align-items: center; 
          margin-bottom: 0.5rem; 
        }

        .rating span {
          font-size: 1.5rem;
        }

        .review-text {
          margin-top: 0.5rem; 
          margin-bottom: 0.5rem;
          font-size: 1rem; 
          color: #333;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .review-date {
          color: #666;
          font-style: italic;
        }

        .no-reviews {
          text-align: center;
          padding: 2rem;
        }

        .loading-container, .error-container {
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}