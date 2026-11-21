import { useEffect } from "react";

function ImageLightbox({ src, alt, onClose }) {
    useEffect(() => {
        if (!src) return;
        function handleKey(e) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [src, onClose]);

    if (!src) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <button
                className="lightbox-close"
                onClick={onClose}
                aria-label="Close full-size image"
            >
                ×
            </button>
            <img
                src={src}
                alt={alt || "Full size preview"}
                className="lightbox-image"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

export default ImageLightbox;
