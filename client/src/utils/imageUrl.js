export function resolveImageUrl(url, apiBaseUrl) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
        return url;
    }
    if (url.startsWith("/")) {
        return `${apiBaseUrl}${url}`;
    }
    return url;
}
