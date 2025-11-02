import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import img1 from "./images/1.png";
import img2 from "./images/2.png";
import img3 from "./images/3.png";
import img4 from "./images/4.png";
import img5 from "./images/5.png";
import img6 from "./images/6.png";
import img7 from "./images/7.png";
import img8 from "./images/8.png";
import img9 from "./images/9.png";
import img10 from "./images/10.png";

function Home() {
  const textStyle = { color: "#000000" };

  const headingStyle = {
    ...textStyle,
    fontWeight: "bold",
    fontSize: "2rem",
    marginBottom: "1rem"
  };

  const leadStyle = {
    ...textStyle,
    fontSize: "1.25rem",
    marginBottom: "1.5rem"
  };

  const sectionTitleStyle = {
    ...textStyle,
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginTop: "3rem",
    marginBottom: "1rem"
  };

  const slideshowImageStyle = {
    width: "100%",
    maxHeight: "500px",
    objectFit: "contain",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  };

  const galleryImageStyle = {
    width: "100%",
    height: "250px",
    objectFit: "cover",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  };

  const sliderWrapperStyle = {
    padding: "1rem",
    backgroundColor: "#E8FDFD",
    borderRadius: "12px",
    maxWidth: "900px",
    marginLeft: "auto",
    marginRight: "auto"
  };

  const galleryWrapperStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: "#F0FFFF",
    borderRadius: "12px",
    maxWidth: "900px",
    margin: "2rem auto"
  };

  const cardStyle = {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "0.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  };

  const footerStyle = {
    width: "100%",
    marginTop: "4rem",
    padding: "2rem 1rem",
    backgroundColor: "#000000",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    borderTop: "2px solid #444",
    textAlign: "center"
  };

  const posters = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

  const featuredPosters = [
    "https://3.bp.blogspot.com/-H57vRpipBhs/T92h_GLMFAI/AAAAAAAAAAc/zLYxoSfXv9w/s1600/avatar_movie_poster_final_01.jpg",
    "https://cdn.mos.cms.futurecdn.net/7SfznToW65UX8QdS65Jn5d-1200-80.jpg",
    "https://www.mockofun.com/wp-content/uploads/2022/12/best-movie-posters.jpg",
    "https://images.squarespace-cdn.com/content/v1/5cf6959864dfad0001763314/1567786818195-D1DHVPQ5SAL90DNHN4F1/Top_15_Movie_Posters_Once_Upon_A_Time.jpg",
    "https://images.complex.com/complex/images/c_fill,dpr_auto,f_auto,q_90,w_1400/fl_lossy,pg_1/gdv2pu6io6ekpg5r8mta/back-to-the-future",
    "https://nextluxury.com/wp-content/uploads/famous-movie-posters-17.png",
    "http://static.metacritic.com/images/products/movies/9/92b0da5d3482fb1665b34a99ed81678c.jpg",
    "https://i.pinimg.com/originals/b3/87/9a/b3879a322f8317b4a48d90ebc5e8988a.jpg",
    "https://i1.wp.com/thinkmonsters.com/speakinghuman/media/wp-content/uploads/Star-Wars-Movie-Poster.jpeg?resize=1054%2C1600",
    "https://www.sohoframes.co.uk/wp-content/uploads/2021/11/samuel-regan-asante-wMkaMXTJjlQ-unsplash-scaled.jpg",
    "https://www.companyfolders.com/blog/media/2017/07/the-silence-of-the-lambs.jpg"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posters.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [posters.length]);

  return (
    <>
      <div className="text-center">
        <h1 style={headingStyle}>Welcome to MovieReviews</h1>
        <p style={leadStyle}>Search movies, read reviews, and write your own.</p>
        <p>
          <Link to="/browse" className="btn btn-primary me-2">Browse Movies</Link>
          <Link to="/my-reviews" className="btn btn-outline-secondary">My Reviews</Link>
        </p>

        {/* ✅ Slideshow Section */}
        <h2 style={sectionTitleStyle}>🎥 Popular Movies 🔥</h2>
        <div style={sliderWrapperStyle}>
          <img
            src={posters[currentIndex]}
            alt={`Poster ${currentIndex + 1}`}
            style={slideshowImageStyle}
          />
        </div>

        {/* ✅ Static Poster Gallery Section */}
        <h2 style={sectionTitleStyle}>🎞️ Featured Posters</h2>
        <div style={galleryWrapperStyle}>
          {featuredPosters.map((src, index) => (
            <div key={index} style={cardStyle}>
              <img src={src} alt={`Featured Poster ${index + 1}`} style={galleryImageStyle} />
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Footer outside centered container */}
      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} MovieReviews. All rights reserved.</p>
        <p>You can review all your love movies and watch trailers 💕🎥</p>
      </footer>
    </>
  );
}

export default Home;