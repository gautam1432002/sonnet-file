import { useState } from 'react';

export interface YouTubeResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  type: 'video' | 'playlist';
}

export const useYouTubeSearch = () => {
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchYouTube = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    
    // 1. Hidden URL Detection Logic
    const isUrl = query.match(/^https?:\/\/(www\.)?youtube\.com|youtu\.be/);
    
    if (isUrl) {
      // Check if it's a playlist URL
      const playlistMatch = query.match(/[?&]list=([^&#]+)/);
      if (playlistMatch) {
        const playlistId = playlistMatch[1];
        await fetchPlaylistItems(playlistId);
        return;
      }
      
      // Check if it's a single video URL
      const videoMatch = query.match(/(?:v=|youtu\.be\/)([^&#]+)/);
      if (videoMatch) {
        const videoId = videoMatch[1];
        await fetchSingleVideo(videoId);
        return;
      }
    }

    // 2. Standard Text Search (Default)
    await fetchSearchResults(query);
  };

  const fetchSearchResults = async (query: string) => {
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const mapped: YouTubeResult[] = data.map((v: any) => ({
        id: v.videoId,
        title: v.title,
        artist: v.author,
        thumbnail: v.thumbnail,
        type: 'video'
      }));
      setResults(mapped);
    } catch (e) {
      console.error(e);
      setResults([]);
    }
    setLoading(false);
  };

  const fetchPlaylistItems = async (playlistId: string) => {
    // For now, if we don't have a playlist endpoint, we just mock or return empty.
    // If the backend doesn't support playlists yet, we can show a placeholder.
    console.log("Fetching Playlist:", playlistId);
    setResults([{
      id: 'dQw4w9WgXcQ',
      title: `Playlist: ${playlistId} (Mock)`,
      artist: 'Playlist Fetch Not Fully Implemented',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      type: 'playlist'
    }]);
    setLoading(false);
  };

  const fetchSingleVideo = async (videoId: string) => {
    // We could hit an endpoint to get the video title, but for direct URLs we might just assume it works
    setResults([{
      id: videoId,
      title: `Direct Video: ${videoId}`,
      artist: 'Direct Link',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      type: 'video'
    }]);
    setLoading(false);
  };

  return { results, searchYouTube, loading };
};
