import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Nav(){
  return (
    <nav className="nav">
      <div className="links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>
    </nav>
  )
}
