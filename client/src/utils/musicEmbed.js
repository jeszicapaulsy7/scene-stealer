// Zero-API-key music URL parser & embed builder
// Supports: YouTube, YouTube Music, Spotify (track/album/playlist/artist/episode/show),
// SoundCloud, direct audio (.mp3/.wav/.ogg/.m4a), and external link fallback.

export function parseMusicLink(rawUrl) {
    const trimmed = rawUrl ? String(rawUrl).trim() : "";
    if (!trimmed) {
        return {
            isEmpty: true,
            isValid: true,
            canEmbed: false,
            embedKind: "none",
            platform: "",
            embedUrl: null,
            originalUrl: "",
        };
    }

    let url;
    try {
        url = new URL(trimmed);
    } catch {
        return {
            isEmpty: false,
            isValid: false,
            canEmbed: false,
            embedKind: "none",
            platform: "Invalid URL",
            embedUrl: null,
            originalUrl: trimmed,
        };
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return {
            isEmpty: false,
            isValid: false,
            canEmbed: false,
            embedKind: "none",
            platform: "Invalid URL",
            embedUrl: null,
            originalUrl: trimmed,
        };
    }

    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // 0. Direct audio files (.mp3, .wav, .ogg, .m4a, .aac)
    if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(pathname)) {
        return {
            isEmpty: false,
            isValid: true,
            canEmbed: true,
            embedKind: "audio",
            platform: "Direct Audio",
            embedUrl: trimmed,
            embedHeight: 54,
            originalUrl: trimmed,
        };
    }

    // 1. YouTube & YouTube Music
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
        const isYtMusic = host.includes("music.youtube.com");
        const platform = isYtMusic ? "YouTube Music" : "YouTube";
        let videoId = "";
        const listId = url.searchParams.get("list") || "";

        if (host.includes("youtu.be")) {
            videoId = pathname.replace(/^\//, "").split("/")[0];
        } else if (pathname.startsWith("/watch")) {
            videoId = url.searchParams.get("v") || "";
        } else if (pathname.startsWith("/shorts/")) {
            videoId = pathname.split("/shorts/")[1]?.split("/")[0] || "";
        } else if (pathname.startsWith("/live/")) {
            videoId = pathname.split("/live/")[1]?.split("/")[0] || "";
        } else if (pathname.startsWith("/embed/")) {
            videoId = pathname.split("/embed/")[1]?.split("/")[0] || "";
        }

        // Ignore auto-generated YouTube radio/mix list IDs (RD...) because they break embeds
        const safeListId =
            listId && !listId.startsWith("RD") ? listId : "";

        if (videoId) {
            const params = new URLSearchParams({
                autoplay: "1",
                rel: "0",
                modestbranding: "1",
            });
            if (safeListId) params.set("list", safeListId);

            return {
                isEmpty: false,
                isValid: true,
                canEmbed: true,
                embedKind: "iframe",
                platform,
                embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`,
                embedHeight: 240,
                originalUrl: trimmed,
            };
        }

        if (safeListId) {
            return {
                isEmpty: false,
                isValid: true,
                canEmbed: true,
                embedKind: "iframe",
                platform,
                embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(safeListId)}&autoplay=1`,
                embedHeight: 240,
                originalUrl: trimmed,
            };
        }

        return {
            isEmpty: false,
            isValid: true,
            canEmbed: false,
            embedKind: "none",
            platform,
            embedUrl: null,
            originalUrl: trimmed,
        };
    }

    // 2. Spotify (track, album, playlist, artist, episode, show — handles /intl-xx/ prefix)
    if (host.includes("spotify.com")) {
        const match = pathname.match(
            /\/(?:intl-[a-z-]+\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/
        );
        if (match) {
            const [, kind, id] = match;
            const height = kind === "track" || kind === "episode" ? 152 : 352;
            return {
                isEmpty: false,
                isValid: true,
                canEmbed: true,
                embedKind: "iframe",
                platform: "Spotify",
                embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
                embedHeight: height,
                originalUrl: trimmed,
            };
        }
        return {
            isEmpty: false,
            isValid: true,
            canEmbed: false,
            embedKind: "none",
            platform: "Spotify",
            embedUrl: null,
            originalUrl: trimmed,
        };
    }

    // 3. SoundCloud
    if (host.includes("soundcloud.com") && pathname.length > 1) {
        return {
            isEmpty: false,
            isValid: true,
            canEmbed: true,
            embedKind: "iframe",
            platform: "SoundCloud",
            embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%23c49a70&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
            embedHeight: 166,
            originalUrl: trimmed,
        };
    }

    // 4. Any other valid music URL
    return {
        isEmpty: false,
        isValid: true,
        canEmbed: false,
        embedKind: "none",
        platform: "External Music",
        embedUrl: null,
        originalUrl: trimmed,
    };
}
