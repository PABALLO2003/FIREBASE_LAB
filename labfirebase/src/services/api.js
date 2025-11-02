import { getAuth } from "firebase/auth";

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-deployed-backend.herokuapp.com'
  : "http://localhost:4000";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function resolveIdToken(maybeToken) {
  if (maybeToken) return maybeToken;
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(false);
  } catch (err) {}
}

async function readResponseBody(res) {
  const text = await res.text().catch(() => "");
  try {
    return { text, json: text ? JSON.parse(text) : null };
  } catch {
    return { text, json: null };
  }
}

export async function fetchReviews(movieId) {
  const url = `${API_URL}/api/reviews/movie/${encodeURIComponent(movieId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await readResponseBody(res);
    const errMsg = body.json ? JSON.stringify(body.json) : body.text;
    throw new Error(`Failed to fetch reviews (${res.status}): ${errMsg}`);
  }
  return res.json();
}

export async function postReview(review, idToken = null) {
  const token = await resolveIdToken(idToken);
  const res = await fetch(`${API_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(review),
  });

  if (!res.ok) {
    const body = await readResponseBody(res);
    const errMsg = body.json ? JSON.stringify(body.json) : body.text;
    throw new Error(`Failed to post review (${res.status}): ${errMsg}`);
  }
  return res.json();
}

export async function updateReview(reviewId, review, idToken = null) {
  const token = await resolveIdToken(idToken);
  const res = await fetch(`${API_URL}/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const body = await readResponseBody(res);
    const errMsg = body.json ? JSON.stringify(body.json) : body.text;
    throw new Error(`Failed to update review (${res.status}): ${errMsg}`);
  }
  return res.json();
}

export async function deleteReview(reviewId, idToken = null) {
  const token = await resolveIdToken(idToken);
  const res = await fetch(`${API_URL}/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(token),
    },
  });
  if (!res.ok) {
    const body = await readResponseBody(res);
    const errMsg = body.json ? JSON.stringify(body.json) : body.text;
    throw new Error(`Failed to delete review (${res.status}): ${errMsg}`);
  }
  return res.json();
}

export async function fetchMyReviews(idToken = null) {
  const token = await resolveIdToken(idToken);
  const res = await fetch(`${API_URL}/api/my-reviews`, {
    headers: {
      ...authHeaders(token),
    },
  });
  if (!res.ok) {
    const body = await readResponseBody(res);
    const errMsg = body.json ? JSON.stringify(body.json) : body.text;
    throw new Error(`Failed to fetch my reviews (${res.status}): ${errMsg}`);
  }
  return res.json();
}