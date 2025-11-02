import React from "react";

function About() {
  const aboutStyle = {
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  };

  const contactStyle = {
    backgroundColor: "#f0f8ff",
    padding: "1rem",
    borderRadius: "6px",
    marginTop: "2rem",
    borderLeft: "4px solid #0d6efd"
  };

  return (
    <div className="container my-4">
      <div style={aboutStyle}>
        <h2>🎬 About MovieReviews</h2>
        <p className="lead">
          Welcome to <strong>MovieReviews</strong> — your cozy corner for discovering great films, sharing your thoughts, and connecting with fellow movie lovers.
        </p>
        <p>
          Whether you're a casual viewer or a full-on film buff, our app helps you:
        </p>
        <ul>
          <li>🔍 Search for movies using real-time data from TMDB</li>
          <li>📝 Read and write reviews from real users</li>
          <li>✏️ Edit your reviews anytime</li>
          <li>📁 Keep track of your personal review history</li>
        </ul>
        <p>
          Sign in to personalize your experience and start contributing to the community. Your voice matters — and your reviews help others discover hidden gems!
        </p>
        <p>
          Built with ❤️ using React, Firebase, and TMDB — designed to be fast, secure, and beginner-friendly.
        </p>

        <div style={contactStyle}>
          <h4>📬 Contact the Creators</h4>
          <p>
            Got feedback, questions, or just want to say hi? We'd love to hear from you!
          </p>
          <ul>
            <li>Email: <a href="mailto:paballopule4@gmail.com">paballopule4@gmail.com</a></li>
            <li>GitHub: <a href="https://github.com/yourusername/moviereviews" target="_blank" rel="noopener noreferrer">github.com/yourusername/moviereviews</a></li>
            <li>WhatsApp: <a href="https://wa.me/26662260505" target="_blank" rel="noopener noreferrer">+266 62260505</a></li>
          </ul>
          <p>
            This project is open-source and always growing — feel free to contribute or share ideas!
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;