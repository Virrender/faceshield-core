import { useState, useRef } from 'react'

function ImageCompareSlider({ originalUrl, cloakedUrl, className = '' }) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef(null)
  const isDragging = useRef(false)

  const handleMouseDown = () => {
    isDragging.current = true
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return
    updateSliderPosition(e.clientX)
  }

  const handleTouchMove = (e) => {
    if (!containerRef.current) return
    updateSliderPosition(e.touches[0].clientX)
  }

  const updateSliderPosition = (clientX) => {
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, x)))
  }

  const handleClick = (e) => {
    if (!containerRef.current) return
    updateSliderPosition(e.clientX)
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square rounded-xl overflow-hidden cursor-ew-resize select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
    >
      {/* Cloaked image (bottom layer) */}
      <img
        src={cloakedUrl}
        alt="Cloaked"
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />

      {/* Original image (top layer, clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${containerRef.current?.offsetWidth || 100}px` }}
          crossOrigin="anonymous"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        {/* Slider handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize"
          onMouseDown={handleMouseDown}
        >
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-[#71717a] rounded-full" />
            <div className="w-0.5 h-4 bg-[#71717a] rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#0f0f13]/80 backdrop-blur rounded-lg text-sm font-medium">
        Original
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#0f0f13]/80 backdrop-blur rounded-lg text-sm font-medium">
        Cloaked
      </div>

      {/* Fallback when no images */}
      {!originalUrl && !cloakedUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#27272a] text-[#71717a]">
          No images available
        </div>
      )}
    </div>
  )
}

export default ImageCompareSlider
