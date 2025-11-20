
import React, { useRef, useEffect, useState } from 'react';

interface MaskingCanvasProps {
  imageUrl: string;
  onMaskChange: (maskDataUrl: string | null) => void;
  brushSize: number;
  isErasing: boolean;
  clearTrigger: number;
}

export const MaskingCanvas: React.FC<MaskingCanvasProps> = ({
  imageUrl,
  onMaskChange,
  brushSize,
  isErasing,
  clearTrigger,
}) => {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const clearCanvas = () => {
    const drawingCanvas = drawingCanvasRef.current;
    const drawingCtx = drawingCanvas?.getContext('2d');
    if (drawingCanvas && drawingCtx) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        onMaskChange(null);
    }
  };

  useEffect(() => {
    if (clearTrigger > 0) {
      clearCanvas();
    }
  }, [clearTrigger]);

  useEffect(() => {
    const imageCanvas = imageCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const imageCtx = imageCanvas?.getContext('2d');
    
    if (!imageCanvas || !drawingCanvas || !imageCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const parent = imageCanvas.parentElement;
      if (!parent) return;

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      const parentAspectRatio = parentWidth / parentHeight;

      let width, height;

      if (imgAspectRatio > parentAspectRatio) {
        width = parentWidth;
        height = parentWidth / imgAspectRatio;
      } else {
        height = parentHeight;
        width = parentHeight * imgAspectRatio;
      }

      imageCanvas.width = width;
      imageCanvas.height = height;
      drawingCanvas.width = width;
      drawingCanvas.height = height;
      
      imageCtx.drawImage(img, 0, 0, width, height);
      clearCanvas();
    };
  }, [imageUrl]);

  const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in evt ? evt.touches[0].clientX : evt.clientX;
    const clientY = 'touches' in evt ? evt.touches[0].clientY : evt.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const draw = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !isDrawing) return;

    const currentPos = getMousePos(canvas!, e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)'; // Orange-500 with opacity for visibility
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.stroke();
    
    lastPos.current = currentPos;
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getMousePos(canvas, e.nativeEvent);
  };
  
  const handleDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isDrawing) {
      draw(e.nativeEvent);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    
    const drawingCanvas = drawingCanvasRef.current;
    const ctx = drawingCanvas?.getContext('2d', { willReadFrequently: true });
    if (!drawingCanvas || !ctx) return;

    const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height).data.buffer);
    const isEmpty = !pixelBuffer.some(color => color !== 0);

    if (isEmpty) {
        onMaskChange(null);
        return;
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = drawingCanvas.width;
    maskCanvas.height = drawingCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.drawImage(drawingCanvas, 0, 0);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    onMaskChange(maskCanvas.toDataURL('image/png'));
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none touch-none">
        <canvas ref={imageCanvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        <canvas
            ref={drawingCanvasRef}
            className="absolute cursor-crosshair"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onMouseDown={handleStartDrawing}
            onMouseMove={handleDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleStartDrawing}
            onTouchMove={handleDrawing}
            onTouchEnd={stopDrawing}
        />
    </div>
  );
};