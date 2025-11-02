import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMovieDetails } from "../services/tmdb";
import { fetchReviews, postReview, updateReview } from "../services/api";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CreateEditReview() {
  const { movieId, reviewId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const loadMovieDetails = useCallback(async (id) => {
    try {
      const movieData = await getMovieDetails(id);
      if (!movieData || !movieData.id) {
        throw new Error("Invalid movie data received");
      }
      return movieData;
    } catch (err) {
      console.error("Error loading movie details:", err);
      throw new Error("Failed to load movie details");
    }
  }, []);

  const loadReviewForEditing = useCallback(async (movieId, reviewId, currentUser) => {
    try {
      
      const allReviews = await fetchReviews(movieId);
      let reviewToEdit = null;

     
      if (Array.isArray(allReviews)) {
        reviewToEdit = allReviews.find((item) => String(item.id) === String(reviewId));
      } else if (allReviews && typeof allReviews === "object") {
        const reviewsArray = allReviews.results || Object.keys(allReviews).map(k => ({ id: k, ...allReviews[k] }));
        reviewToEdit = reviewsArray.find((item) => String(item.id) === String(reviewId));
      }

      if (!reviewToEdit) {
        setError("Review not found.");
        setLoading(false);
        return;
      }

      
      if (reviewToEdit.uid && reviewToEdit.uid !== currentUser.uid) {
        setError("You can only edit your own reviews.");
        setLoading(false);
        return;
      }

      
      setRating(reviewToEdit.rating || 5);
      setContent(reviewToEdit.text || reviewToEdit.content || "");
      
     
      if (reviewToEdit.displayName) {
        setDisplayName(reviewToEdit.displayName);
      }
      
      setIsEditMode(true);
      setLoading(false);

    } catch (err) {
      console.error("Error loading review:", err);
      setError("Failed to load review for editing");
      setLoading(false);
    }
  }, []);

  const loadMovieAndReview = useCallback(async (movieId, reviewId, currentUser) => {
    try {
      setLoading(true);
      setError("");

    
      const movieData = await loadMovieDetails(movieId);
      setMovie(movieData);

    
      if (reviewId) {
        await loadReviewForEditing(movieId, reviewId, currentUser);
      } else {
        setIsEditMode(false);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err?.message || "Failed to load data");
      setLoading(false);
    }
  }, [loadMovieDetails, loadReviewForEditing]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      
      setUser(currentUser);
      
      if (currentUser) {
  
        const userDisplayName = currentUser.displayName || currentUser.email || currentUser.uid;
        if (!displayName) {
          setDisplayName(userDisplayName);
        }
        
     
        if (movieId && mounted) {
          await loadMovieAndReview(movieId, reviewId, currentUser);
        }
      } else {
        
        if (movieId && mounted) {
          try {
            const movieData = await loadMovieDetails(movieId);
            setMovie(movieData);
          } catch (err) {
            console.error("Error loading movie:", err);
            setError("Failed to load movie");
          }
        }
        if (reviewId) {
          setError("You must be signed in to edit a review.");
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [movieId, reviewId, displayName, loadMovieAndReview, loadMovieDetails]);

  const effectiveDisplayName = () => {
    if (displayName && displayName.trim()) return displayName.trim();
    if (user) return user.displayName || user.email || user.uid || "";
    return localStorage.getItem("displayName") || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const chosenDisplayName = effectiveDisplayName();
    if (!chosenDisplayName) {
      setError("Please provide a display name.");
      return;
    }

    if (!movieId) {
      setError("Missing movie ID.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }

    if (!content.trim()) {
      setError("Please write a review.");
      return;
    }

    
    const payload = {
      movieId: String(movieId),
      rating,
      text: content.trim(),  
      movieTitle: movie?.title || "",
      
    };

    console.log("📤 Sending payload:", payload); 

    try {
      setSaving(true);
      
      if (isEditMode && reviewId) {
        await updateReview(reviewId, payload);
      } else {
        await postReview(payload);
      }

  
      try {
        localStorage.setItem("displayName", chosenDisplayName);
      } catch (e) {
        console.warn("Could not save display name to localStorage:", e);
      }

     
      navigate(`/movie/${movieId}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err?.message || "Failed to save review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/movie/${movieId}`);
  };


  const containerStyle = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    minHeight: "100vh"
  };

  const formContainerStyle = {
    backgroundColor: "#e6ffe6",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #ccc"
  };

  const trailerWrapperStyle = {
    width: "100%",
    aspectRatio: "16/9",
    backgroundColor: "#000",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
  };

  const movieHeaderStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #ddd"
  };

  const moviePosterStyle = {
    width: "100px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "5px",
    marginRight: "1rem"
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1.5rem"
  };

 
  const messageContainerStyle = {
    textAlign: "center",
    padding: "2rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    margin: "2rem 0"
  };

 
  const trailerMap = {
    "Black Panther": "https://www.youtube.com/embed/xjDjIWPwcPU",
    "Black Panther: Wakanda Forever": "https://www.youtube.com/embed/_Z3QKkl1WyM",
    "I.D.": "https://www.youtube.com/embed/IKg4HPOnAA8",
    "The Matrix": "https://www.youtube.com/embed/vKQi3bBA1y8",
    "Inception": "https://www.youtube.com/embed/YoHD9XEInc0",
    "Interstellar": "https://www.youtube.com/embed/zSWdZVtXT7E",
    "Avengers: Endgame": "https://www.youtube.com/embed/TcMBFSGVi1c",
    "The Dark Knight": "https://www.youtube.com/embed/EXeTwQWrcwY"
  };

  const trailerUrl = trailerMap[movie?.title] || "https://www.youtube.com/embed/dQw4w9WgXcQ";


  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={messageContainerStyle}>
          <h4>{isEditMode ? "Loading Review..." : "Loading Movie..."}</h4>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }


  if (!movie && !loading) {
    return (
      <div style={containerStyle}>
        <div style={messageContainerStyle}>
          <h4>Error</h4>
          <p>Movie not found. Please check the URL and try again.</p>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        {/* Movie Header */}
        <div style={movieHeaderStyle}>
          {movie?.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
              alt={movie.title}
              style={moviePosterStyle}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div>
            <h4 className="mb-2">
              {isEditMode ? "Edit Review" : "Write a Review"}
            </h4>
            <h5 className="text-muted">{movie?.title}</h5>
            {movie?.release_date && (
              <small className="text-muted">
                Released: {new Date(movie.release_date).getFullYear()}
              </small>
            )}
          </div>
        </div>

        {/* Trailer Section */}
        <div style={trailerWrapperStyle}>
          <iframe
            width="100%"
            height="100%"
            src={trailerUrl}
            title={`Trailer for ${movie?.title}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit}>
          {/* Rating Field */}
          <div className="mb-3">
            <label className="form-label fw-bold">Your Rating</label>
            <select 
              className="form-select" 
              value={rating} 
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Very Good</option>
              <option value={5}>5 - Excellent</option>
            </select>
            <div className="form-text">
              How would you rate this movie? (1-5 stars)
            </div>
          </div>

          {/* Review Content Field */}
          <div className="mb-3">
            <label className="form-label fw-bold">Your Review</label>
            <textarea
              className="form-control"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about the movie... What did you like or dislike? Would you recommend it?"
            />
            <div className="form-text">
              Write a detailed review to help other viewers.
            </div>
          </div>

          {/* Display Name Field */}
          <div className="mb-3">
            <label className="form-label fw-bold">Display Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter how you want to be known"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="form-text">
              {user ? (
                "You can customize how your name appears. If left empty, your account name will be used."
              ) : (
                "Your display name will be saved for future reviews."
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={buttonGroupStyle}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {isEditMode ? "Updating..." : "Submitting..."}
                </>
              ) : (
                isEditMode ? "Update Review" : "Submit Review"
              )}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}