// Extract a YouTube video ID from the common URL shapes (watch?v=, youtu.be/,
// /embed/, /shorts/). Returns null if none is found.
export const youtubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Bare 11-char id
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return null;
};

export const youtubeEmbed = (url) => {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};
