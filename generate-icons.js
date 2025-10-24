const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#ec4899');
  
  // Background with rounded corners
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Film reel icon
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.25;
  
  // Main circle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Film holes
  const holeRadius = size * 0.03;
  const holeDistance = radius * 0.7;
  
  ctx.fillStyle = '#071226';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x = centerX + Math.cos(angle) * holeDistance;
    const y = centerY + Math.sin(angle) * holeDistance;
    
    ctx.beginPath();
    ctx.arc(x, y, holeRadius, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  // Center hole
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.05, 0, 2 * Math.PI);
  ctx.fill();
  
  return canvas.toBuffer('image/png');
}

// Generate icons
const icon192 = createIcon(192);
const icon512 = createIcon(512);

fs.writeFileSync('./public/icon-192x192.png', icon192);
fs.writeFileSync('./public/icon-512x512.png', icon512);

console.log('Icons generated successfully!');