import React from "react";
import { Link } from "react-router-dom";
import { posterUrl } from "../services/tmdb";

function MovieCard({ movie }) {
  return (
    <div className="card mb-3">
      <div className="row g-0">
        <div className="col-md-3">
          {movie.poster_path ? (
            <img src={posterUrl(movie.poster_path, "w342")} alt={movie.title} className="img-fluid rounded-start" />
          ) : (
            <div className="bg-secondary text-white d-flex align-items-center justify-content-center" style={{height: '100%'}}>No Image</div>
          )}
        </div>
        <div className="col-md-9">
          <div className="card-body">
            <h5 className="card-title">{movie.title}</h5>
            <p className="card-text"><small className="text-muted">{movie.release_date}</small></p>
            <p className="card-text">
              <Link to={`/movie/${movie.id}`} className="btn btn-primary btn-sm">Details</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;