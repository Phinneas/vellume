// Generate pixel art from text using canvas
export async function generatePixelArt(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create main canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Generate a color palette based on text hash
      const hash = text.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      // Create color palette from hash
      const hue1 = Math.abs(hash % 360);
      const hue2 = (hue1 + 120) % 360;
      const hue3 = (hue1 + 240) % 360;
      
      const colors = [
        `hsl(${hue1}, 70%, 60%)`,
        `hsl(${hue2}, 70%, 50%)`,
        `hsl(${hue3}, 70%, 40%)`,
        `hsl(${hue1}, 60%, 80%)`,
        '#F4EBD9', // Background color
        '#2C3E50', // Dark color
      ];
      
      // Fill background
      ctx.fillStyle = colors[4];
      ctx.fillRect(0, 0, 512, 512);
      
      // Create pixel grid (16x16 pixels, each 32px)
      const pixelSize = 32;
      const gridSize = 16;
      
      // Generate pattern based on text
      const seed = Math.abs(hash);
      
      // Draw pixel art pattern
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          // Use text characters to determine pixel placement
          const charIndex = (x + y * gridSize) % text.length;
          const charCode = text.charCodeAt(charIndex);
          
          // Determine if pixel should be drawn based on character
          const shouldDraw = (charCode + seed + x * y) % 3 !== 0;
          
          if (shouldDraw) {
            // Choose color based on position and character
            const colorIndex = (charCode + x + y) % 4;
            ctx.fillStyle = colors[colorIndex];
            
            // Draw pixel with slight variation
            const offsetX = ((charCode * x) % 3) - 1;
            const offsetY = ((charCode * y) % 3) - 1;
            
            ctx.fillRect(
              x * pixelSize + offsetX,
              y * pixelSize + offsetY,
              pixelSize - 2,
              pixelSize - 2
            );
          }
        }
      }
      
      // Add border
      ctx.strokeStyle = colors[5];
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 508, 508);
      
      // Add text at bottom
      ctx.fillStyle = colors[5];
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      const displayText = text.length > 30 ? text.substring(0, 27) + '...' : text;
      ctx.fillText(displayText, 256, 490);
      
      // Return data URL
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to convert data URL to blob
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}
