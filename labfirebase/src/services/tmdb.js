const BACKEND = process.env.NODE_ENV === 'production'
  ? 'https://your-deployed-backend.herokuapp.com'
  : "http://localhost:4000";

async function request(path) {
  const url = `${BACKEND}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let bodyText = "";
    try { 
      bodyText = await res.text(); 
    } catch (e) {
      console.error('Failed to read response body:', e);
    }
    throw new Error(`TMDb proxy request failed: ${res.status} ${res.statusText} - ${bodyText}`);
  }
  
  return res.json();
}

async function searchMovies(query, page = 1) {
  const q = encodeURIComponent(query);
  console.log("Searching for movies with query:", query);
  return request(`/tmdb/search?query=${q}&page=${page}`);
}

async function getMovieDetails(id) {
  return request(`/tmdb/movie/${encodeURIComponent(id)}`);
}

function posterUrl(path, size = "w342") {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export { searchMovies, getMovieDetails, posterUrl };