import React from 'react';

const ColorIndicator = ({
  position,
}) => {
  const height = 2;
  const lineX = `${position * 100}%`;
  return (
    <svg width="100%" height={height}>
      <rect x="0" y="0" width="33.33%" height={height} fill="#ff2d55" />
      <rect x="33.33%" y="0" width="33.33%" height={height} fill="#ffb800" />
      <rect x="66.66%" y="0" width="33.34%" height={height} fill="#00af9b" />
      <line
        x1={lineX}
        y1="0"
        x2={lineX}
        y2={height}
        stroke="#000000d9"
        strokeWidth="2"
      />
    </svg>
  )
}

export default ColorIndicator;
