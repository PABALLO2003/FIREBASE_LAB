import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import MovieDetails from "./pages/MovieDetails";
import CreateEditReview from "./pages/CreateEditReview";
import MyReviews from "./pages/MyReviews";
import SignIn from "./pages/SignIn";
import About from "./pages/About";

function App() {
  const pageStyle = {
    backgroundColor: "#373237",
    minHeight: "100vh",
    paddingBottom: "2rem"
  };

  return (
    <div style={pageStyle}>
      <Header />
      <div className="container my-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          {/* Create new review */}
          <Route path="/review/:movieId/new" element={<CreateEditReview />} />
          {/* Edit review - existing route */}
          <Route path="/review/:movieId/edit/:reviewId" element={<CreateEditReview />} />
          {/* Add this new route for the simpler pattern */}
          <Route path="/review/:movieId/:reviewId" element={<CreateEditReview />} />
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;