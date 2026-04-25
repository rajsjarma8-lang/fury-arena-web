
import React from 'react';

interface YouTubeBannerProps {
  videoId: string;
}

const YouTubeBanner: React.FC<YouTubeBannerProps> = ({ videoId }) => {
  // Helper to extract ID from various YouTube URL formats
  const extractId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const cleanId = extractId(videoId);
  const videoUrl = `https://www.youtube.com/watch?v=${cleanId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`;
  const fallbackUrl = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;

  return (
    <a 
      href={videoUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900 relative group transition-transform hover:scale-[1.01] duration-500"
    >
      <img 
        src={thumbnailUrl} 
        alt="Battle" 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== fallbackUrl) {
            target.src = fallbackUrl;
          }
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity"></div>
    </a>
  );
};

export default YouTubeBanner;
