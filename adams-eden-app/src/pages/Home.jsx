import React from 'react'

export default function Home(){
  return (
    <div className="home">
      <header className="hero">
        <div className="hero-content">
          <h1>Welcome to Adams Eden</h1>
          <p className="lead">Grow your knowledge. Discover plants, tips, and beautiful varieties.</p>
          <div className="hero-cta">
            <a className="btn primary" href="/gallery">Explore Gallery</a>
            <a className="btn" href="/contact">Get In Touch</a>
          </div>
        </div>
        <div className="hero-image" aria-hidden="true"></div>
      </header>

      <section className="features">
        <div className="feature">
          <h3>Plant ID</h3>
          <p>Quick identification tips and resources to help you learn.</p>
        </div>
        <div className="feature">
          <h3>Care Guides</h3>
          <p>Practical watering, light and soil advice for common houseplants.</p>
        </div>
        <div className="feature">
          <h3>Gallery</h3>
          <p>Beautiful curated images and inspiration for your green space.</p>
        </div>
      </section>
    </div>
  )
}
