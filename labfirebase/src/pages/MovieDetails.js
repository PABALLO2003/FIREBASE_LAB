import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieDetails, posterUrl } from "../services/tmdb";
import { fetchReviews, deleteReview } from "../services/api";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [userIdent, setUserIdent] = useState("");
  const [userUid, setUserUid] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserIdent(user.displayName || user.email || user.uid || "");
        setUserUid(user.uid || null);
      } else {
        setUserIdent(localStorage.getItem("displayName") || "");
        setUserUid(null);
      }
    });
    return () => unsub();
  }, []);


  useEffect(() => {
    let mounted = true;
    
    async function load() {
      setLoading(true);
      setErr("");
      setReviewsError("");

    
      try {
        console.log("Loading movie details for ID:", id);
        const m = await getMovieDetails(id);
        if (!mounted) return;
        console.log("Movie loaded:", m.title);
        setMovie(m);
      } catch (error) {
        if (!mounted) return;
        console.error("Movie load error:", error);
        setErr(error?.message || "Failed to load movie details");
      }

   
      try {
        console.log("Loading reviews for movie:", id);
        const r = await fetchReviews(id);
        if (!mounted) return;
        
        if (Array.isArray(r)) {
          console.log("Reviews loaded:", r.length);
          setReviews(r);
        } else {
          console.log("No reviews or unexpected format:", r);
          setReviews([]);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("fetchReviews error:", error);
        setReviews([]);
        setReviewsError(error?.message || "Failed to fetch reviews");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    load();
    return () => {
      mounted = false;
    };
  }, [id, refreshKey]);

 
  async function handleDelete(reviewId) {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error("deleteReview error:", error);
      alert(error?.message || "Failed to delete review");
    }
  }


  function formatDate(ts) {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
  }


  const pageStyle = {
    backgroundColor: "#1c1c1c",
    color: "#f5f5f5",
    padding: "2rem",
    minHeight: "100vh"
  };

  const cardStyle = {
    backgroundColor: "#2a2a2a",
    color: "#e0e0e0",
    border: "none"
  };

  const posterStyle = {
    width: "100%",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
  };

  const errorBoxStyle = {
    backgroundColor: "#3a1c1c",
    color: "#f8d7da",
    border: "1px solid #842029",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem"
  };

  const retryButtonStyle = {
    backgroundColor: "#842029",
    color: "#fff",
    border: "none"
  };

  const releaseDateStyle = {
    color: "#b0b0b0",
    fontWeight: "500"
  };

  return (
    <div style={pageStyle}>
      {loading && <div>Loading movie...</div>}
      {err && (
        <div style={errorBoxStyle}>
          <strong>Error loading movie:</strong> {err}
          <div className="mt-2">
            <button className="btn btn-sm" style={retryButtonStyle} onClick={() => setRefreshKey(k => k + 1)}>
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && movie && (
        <>
          <div className="row mb-4">
            <div className="col-md-4">
              {movie.poster_path ? (
                <img src={posterUrl(movie.poster_path)} alt={movie.title} style={posterStyle} />
              ) : (
                <div className="bg-dark text-light d-flex align-items-center justify-content-center" style={{ height: 400 }}>
                  No image
                </div>
              )}
            </div>

            <div className="col-md-8">
              <h2>{movie.title}</h2>
              <p><small style={releaseDateStyle}>{movie.release_date}</small></p>
              <p>{movie.overview}</p>
              <p>
                {userIdent ? (
                  <Link className="btn btn-success" to={`/review/${id}/new`}>Write a Review</Link>
                ) : (
                  <span className="text-muted">Sign in to write a review.</span>
                )}
              </p>
            </div>
          </div>

          <h4>Reviews</h4>

          {reviewsError && (
            <div style={errorBoxStyle}>
              <strong>Failed to fetch reviews:</strong> {reviewsError}
              <div className="mt-2">
                <button className="btn btn-sm" style={retryButtonStyle} onClick={() => setRefreshKey(k => k + 1)}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {!reviewsError && reviews.length === 0 && <div>No reviews yet — be the first!</div>}

          {reviews.map(r => {
            const author = r.displayName || r.userId || "Anonymous";
            const created = r.createdAt || r.updatedAt || r.timestamp || "";
            return (
              <div key={r.id} className="card mb-2" style={cardStyle}>
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <strong>{author}</strong> — <small className="text-muted">{formatDate(created)}</small>
                    <div>Rating: {r.rating}/5</div>
                    <p>{r.text || r.content}</p>
                  </div>

                  <div>
                    {(r.displayName === userIdent || (r.userId && userUid && r.userId === userUid)) && (
                      <>
                        <Link to={`/review/${id}/edit/${r.id}`} className="btn btn-sm btn-outline-primary me-2">Edit</Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default MovieDetails;