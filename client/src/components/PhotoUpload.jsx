import { useState, useRef, useEffect } from "react";
import { resolveImageUrl } from "../utils/imageUrl";

function PhotoUpload({ apiBaseUrl, value, onChange, label = "Photo (Upload or URL)" }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [localPreview, setLocalPreview] = useState("");
    const [imgLoadError, setImgLoadError] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (localPreview) {
                URL.revokeObjectURL(localPreview);
            }
        };
    }, [localPreview]);

    async function handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError("");
        setUploadSuccess(false);
        setImgLoadError(false);

        const objectUrl = URL.createObjectURL(file);
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(objectUrl);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch(`${apiBaseUrl}/api/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Photo upload failed.");
            }
            onChange(data.imageUrl);
            setUploadSuccess(true);
        } catch (err) {
            setUploadError(
                err.message ||
                    "Could not upload image. Make sure the backend server is running on port 5000."
            );
            setLocalPreview("");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    const resolvedUrl = resolveImageUrl(value, apiBaseUrl);
    const previewSrc = localPreview || resolvedUrl;

    return (
        <div className="photo-upload-field">
            <span className="form-label">{label}</span>

            <div className="photo-upload-controls">
                <button
                    type="button"
                    className="photo-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? "Uploading photo..." : "↑ Upload from device"}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="sr-only"
                />

                <input
                    type="text"
                    placeholder="Or paste a direct image URL (https://...)"
                    value={value}
                    onChange={(e) => {
                        setUploadError("");
                        setUploadSuccess(false);
                        setImgLoadError(false);
                        setLocalPreview("");
                        onChange(e.target.value);
                    }}
                    className="photo-url-input"
                />
            </div>

            {uploadError && <p className="photo-upload-error">{uploadError}</p>}

            {uploadSuccess && !uploadError && (
                <p className="photo-upload-success">
                    ✓ Photo uploaded! Click the save/pin button below to keep it.
                </p>
            )}

            {previewSrc && !imgLoadError && (
                <div className="photo-preview-wrap">
                    <img
                        src={previewSrc}
                        alt="Uploaded preview"
                        className="photo-preview-img"
                        onError={() => setImgLoadError(true)}
                    />
                    <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => {
                            setLocalPreview("");
                            setUploadSuccess(false);
                            setImgLoadError(false);
                            onChange("");
                        }}
                    >
                        Remove photo
                    </button>
                </div>
            )}

            {imgLoadError && value && (
                <p className="photo-upload-error">
                    This link couldn&apos;t be loaded as an image. Try using &ldquo;Upload from
                    device&rdquo; or paste a direct image URL ending in .jpg / .png / .webp.
                </p>
            )}
        </div>
    );
}

export default PhotoUpload;
