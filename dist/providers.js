export const providers = [
    {
        name: "VidRock",
        idType: "tmdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://vidrock.net/movie/${id}`
            : `https://vidrock.net/tv/${id}/${season}/${episode}`,
    },
    {
        name: "Videasy",
        idType: "tmdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://player.videasy.net/movie/${id}`
            : `https://player.videasy.net/tv/${id}/${season}/${episode}`,
    },
    {
        name: "MoviesApi",
        idType: "tmdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://moviesapi.club/movie/${id}`
            : `https://moviesapi.club/tv/${id}/${season}/${episode}`,
    },
    {
        name: "VidSrc (v3)",
        idType: "tmdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://vidsrc.cc/v3/embed/movie/${id}`
            : `https://vidsrc.cc/v3/embed/tv/${id}/${season}-${episode}`,
    },
    {
        name: "VidSrc (rip)",
        idType: "imdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://vidsrc.rip/embed/movie/${id}`
            : `https://vidsrc.rip/embed/tv/${id}/${season}-${episode}`,
    },
    {
        name: "VidSrc (to)",
        idType: "imdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://vidsrc.to/embed/movie/${id}`
            : `https://vidsrc.to/embed/tv/${id}/${season}-${episode}`,
    },
    {
        name: "VidSrc Pro",
        idType: "imdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://vidsrc.pro/embed/movie/${id}`
            : `https://vidsrc.pro/embed/tv/${id}/${season}-${episode}`,
    },
    {
        name: "SmashyStream",
        idType: "imdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://smashystream.com/embed/movie/${id}`
            : `https://smashystream.com/embed/tv/${id}/${season}/${episode}`,
    },
    {
        name: "2Embed",
        idType: "tmdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://www.2embed.cc/embed/${id}`
            : `https://www.2embed.cc/embedtv/${id}?s=${season}&e=${episode}`,
    },
    {
        name: "Voe.sx (via Vidplay shell)",
        idType: "imdb",
        url: ({ type, id, season, episode }) => type === "movie"
            ? `https://vidplay.site/embed/movie/${id}`
            : `https://vidplay.site/embed/tv/${id}/${season}/${episode}`,
    },
];
export const PER_PROVIDER_MAX_MS = 45_000;
