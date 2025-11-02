import React from 'react'

const sampleImages = [
  'https://placehold.co/600x400?text=Plant+1',
  'https://placehold.co/600x400?text=Plant+2',
  'https://placehold.co/600x400?text=Plant+3'
]

export default function Gallery(){
  return (
    <section>
      <h1>Gallery</h1>
      <div className="gallery">
        {sampleImages.map((src,i)=> (
          <img key={i} src={src} alt={`plant ${i+1}`} />
        ))}
      </div>
    </section>
  )
}
