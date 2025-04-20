import React from 'react';

const ColorIndicator = ({
  position,
}) => {
  return (
    <svg width="100%" height="2px">
      <rect x="0" y="0" width="33.33%" height="2" fill="#ff2d55" />
      <rect x="33.33%" y="0" width="33.33%" height="2" fill="#ffb800" />
      <rect x="66.66%" y="0" width="33.34%" height="2" fill="#00af9b" />
      <line
        x1={`${position * 100}%`}
        y1="0"
        x2={`${position * 100}%`}
        y2="2"
        stroke="#000000d9"
        strokeWidth="2"
      />
    </svg>
  )
}

export default ColorIndicator;