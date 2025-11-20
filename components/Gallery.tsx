import React, { useState, useEffect } from 'react';
import type { GeneratedImage, GenerationPayload } from '../types';
import { Icon } from './Icon';

interface GalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  generatingCount: number;
  onViewImage: (index: number) => void;
  onRegenerate: (image: GeneratedImage) => void;
  onUpscale: (image: GeneratedImage) => void;
}

const LoadingPlaceholder: React.FC = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl shadow-xl">
        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            {/* Orbiting particles - Adjusted colors */}
            <div
                className="absolute w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_15px_theme(colors.orange.500)]"
                style={{ animation: 'orbit 6s linear infinite', '--orbit-radius': '60px' } as React.CSSProperties}
            />
            <div
                className="absolute w-3 h-3 bg-violet-500 rounded-full shadow-[0_0_15px_theme(colors.violet.500)]"
                style={{ animation: 'orbit 10s linear infinite reverse', '--orbit-radius': '90px' } as React.CSSProperties}
            />
            <div
                className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_10px_theme(colors.purple.400)]"
                style={{ animation: 'orbit 8s linear infinite', '--orbit-radius': '75px' } as React.CSSProperties}
            />

            {/* Pulsing Core */}
            <div
                className="w-16 h-16 bg-gradient-to-br from-orange-400 to-violet-600 rounded-full blur-[2px]"
                style={{ animation: 'pulse-core 3s infinite ease-in-out' }}
            />
             <div
                className="absolute w-12 h-12 bg-white rounded-full blur-xl opacity-60"
            />
        </div>
        <p className="font-subtitle text-2xl font-semibold text-slate-800 tracking-wider animate-text-pulse mb-4">
            Crafting your vision...
        </p>
        <p className="text-xs text-slate-500 font-subtitle max-w-xs mx-auto">
            The AI is weaving light and shadow to create your scene. This may take a moment.
        </p>
    </div>
);


const EmptyState: React.FC = () => (
  <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl">
    <Icon path="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" className="w-16 h-16 text-slate-400 mb-4" />
    <h3 className="text-xl font-bold text-slate-700">Your Generated Scenes Appear Here</h3>
    <p className="mt-2 max-w-md text-slate-500">
      Describe your scene on the left (character and style images are optional) and click "Generate" to bring your vision to life.
    </p>
  </div>
);

const ImageCard: React.FC<{ image: GeneratedImage; onViewImage: () => void; onRegenerate: (image: GeneratedImage) => void; onUpscale: (image: GeneratedImage) => void; }> = ({ image, onViewImage, onRegenerate, onUpscale }) => {
  const [copied, setCopied] = React.useState(false);

  const displayPrompt = image.editPrompt ? `Edited: ${image.editPrompt}` : image.prompt;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    link.download = `rizuna-ai-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionButtonClasses = "p-2 rounded-full bg-white/80 hover:bg-indigo-600 text-slate-600 hover:text-white backdrop-blur-sm transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-md";

  return (
    <div className="relative group aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg bg-white animate-materialize transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50 border border-white/80 hover:border-indigo-300">
      <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1.5">
        {image.upscaled && (
          <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wide">
              Upscaled
          </div>
        )}
        {image.editPrompt && (
          <div className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wide">
              Edited
          </div>
        )}
      </div>
      <img src={image.url} alt="Generated scene" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" onClick={onViewImage} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
        <button onClick={() => onUpscale(image)} className={actionButtonClasses} aria-label="Upscale Image" title="Upscale">
          <Icon path="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6l-5.25 5.25" className="w-4 h-4" />
        </button>
        <button onClick={() => onRegenerate(image)} className={actionButtonClasses} aria-label="Regenerate Image" title="Regenerate">
            <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l.813 2.846a4.5 4.5 0 003.09 3.09L24 18.75l-1.846.813a4.5 4.5 0 00-3.09 3.09L18.25 24l-.813-2.846a4.5 4.5 0 00-3.09-3.09L12.5 18.75l1.846-.813a4.5 4.5 0 003.09-3.09L18.25 12zM12.5 2.25l.813 2.846a4.5 4.5 0 003.09 3.09L18.25 9l-1.846.813a4.5 4.5 0 00-3.09 3.09L12.5 15.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L5.25 9l1.846-.813a4.5 4.5 0 003.09-3.09L12.5 2.25z" className="w-4 h-4" />
        </button>
        <button onClick={onViewImage} className={actionButtonClasses} aria-label="View Image" title="Expand">
          <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" />
        </button>
        <button onClick={handleDownload} className={actionButtonClasses} aria-label="Download Image" title="Download">
          <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 transform translate-y-full group-hover:translate-y-0">
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg flex items-center justify-between border border-white shadow-lg">
            <p className="text-xs text-slate-700 font-mono truncate mr-2 select-none" title={displayPrompt}>{displayPrompt}</p>
            <button onClick={handleCopy} className="text-indigo-600 hover:text-indigo-800 transition-colors flex-shrink-0 relative">
                <Icon path={copied ? "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5m-9 7.5h9A2.25 2.25 0 0018 12.75V9A2.25 2.25 0 0015.75 6.75h-7.5A2.25 2.25 0 006 9v3.75c0 1.24 1.01 2.25 2.25 2.25z"} className="w-5 h-5"/>
                {copied && <span className="absolute -top-8 -left-1/2 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded shadow-lg">Copied</span>}
            </button>
        </div>
      </div>
    </div>
  );
};

const GeneratingIndicator: React.FC = () => {
  const messages = [
    "Consulting the neural network...",
    "Painting with pixels...",
    "Applying cinematic lighting...",
    "Rendering details...",
    "Refining textures...",
  ];
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessage(prevMessage => {
        const currentIndex = messages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="md:col-span-1 flex flex-col items-center justify-center gap-4 p-6 rounded-xl border border-indigo-100 bg-white/60 backdrop-blur-sm animate-fade-in shadow-sm">
      <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute w-full h-full border-2 border-orange-400/30 rounded-full animate-spin-slow"></div>
          <div className="absolute w-3/4 h-3/4 border-2 border-violet-400/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800 tracking-wide text-sm">Generating</p>
        <p key={currentMessage} className="text-xs text-slate-500 mt-1 animate-fade-in">{currentMessage}</p>
      </div>
    </div>
  );
};


export const Gallery: React.FC<GalleryProps> = ({ images, isLoading, generatingCount, onViewImage, onRegenerate, onUpscale }) => {
  const showLoading = isLoading && images.length === 0;

  if (showLoading) {
    return <LoadingPlaceholder />;
  }

  if (images.length === 0) {
    return <EmptyState />;
  }

  const showGeneratingIndicator = isLoading && images.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      {showGeneratingIndicator && (
        generatingCount >= 2 ? (
          <>
            <GeneratingIndicator />
            <GeneratingIndicator />
          </>
        ) : (
          <GeneratingIndicator />
        )
      )}
      {images.map((image, index) => (
        <ImageCard key={image.id} image={image} onViewImage={() => onViewImage(index)} onRegenerate={onRegenerate} onUpscale={onUpscale} />
      ))}
    </div>
  );
};