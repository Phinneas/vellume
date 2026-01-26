export async function generatePixelArt(text: string): Promise<string> {
  return new Promise((resolve) => {
    // Create main canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Fill background
    ctx.fillStyle = '#F4EBD9';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Set text style
    ctx.fillStyle = '#2C3E50';
    ctx.font = '24px monospace';
    
    // Draw text wrapped at ~60 characters per line
    const words = text.split(' ');
    let line = '';
    let y = 100;
    
    for (const word of words) {
      if (line.length + word.length > 60) {
        ctx.fillText(line, 50, y);
        line = word + ' ';
        y += 30;
      } else {
        line += word + ' ';
      }
    }
    
    // Draw remaining text
    if (line) {
      ctx.fillText(line, 50, y);
    }
    
    // Create temp canvas for pixelation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 128;
    tempCanvas.height = 128;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('Could not get temp canvas context');
    }
    
    // Draw main canvas onto temp canvas
    tempCtx.drawImage(canvas, 0, 0, 128, 128);
    
    // Clear main canvas
    ctx.clearRect(0, 0, 1024, 1024);
    
    // Disable smoothing for pixel art effect
    ctx.imageSmoothingEnabled = false;
    
    // Draw temp canvas back to main at full size
    ctx.drawImage(tempCanvas, 0, 0, 1024, 1024);
    
    // Return data URL
    resolve(canvas.toDataURL('image/png'));
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