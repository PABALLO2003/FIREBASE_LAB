import React, { useState } from "react";
import { searchMovies } from "../services/tmdb";
import MovieCard from "../components/MovieCard";

function Browse() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    try {
      console.log("Searching for:", query);
      const data = await searchMovies(query);
      console.log("Search results:", data);
      setResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const formStyle = {
    backgroundColor: "#FDFAFD",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    marginBottom: "1.5rem"
  };

  const inputStyle = {
    backgroundColor: "#F28CEE",
    color: "#212529",
    border: "1px solid #ffc107"
  };

  const buttonStyle = {
    backgroundColor: "#343a40",
    color: "#fff",
    border: "none"
  };

  const cardContainerStyle = {
    backgroundColor: "#8CAAF2",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  };

  const headingStyle = {
    color: "#ffffff",
    backgroundColor: "#343a40",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    fontWeight: "bold",
    fontSize: "1.5rem"
  };

  const fallbackStyle = {
    color: "#f8f9fa",
    backgroundColor: "#6c757d",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontStyle: "italic",
    marginBottom: "1rem"
  };

  const errorStyle = {
    color: "#dc3545",
    backgroundColor: "#f8d7da",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    border: "1px solid #f5c6cb",
    marginBottom: "1rem"
  };

  return (
    <div className="container">
      <h2 style={headingStyle}>Browse Movies</h2>
      <form style={formStyle} onSubmit={handleSearch}>
        <div className="input-group">
          <input
            className="form-control"
            style={inputStyle}
            placeholder="Search movies by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn" style={buttonStyle} type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {loading && <div style={{ color: "#f8f9fa" }}>Loading movies...</div>}
      
      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {results.length === 0 && !loading && !error && (
        <div style={fallbackStyle}>No results yet — try searching for a movie title.</div>
      )}

      {results.length > 0 && (
        <div className="row">
          {results.map((movie) => (
            <div className="col-md-4 mb-4" key={movie.id}>
              <div style={cardContainerStyle}>
                <MovieCard movie={movie} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Browse;