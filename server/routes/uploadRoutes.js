const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const rawExt = path.extname(file.originalname).toLowerCase();
        const ext = rawExt && rawExt.length <= 6 ? rawExt : ".jpg";
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, safeName);
    },
});

const fileFilter = (req, file, cb) => {
    const extAllowed = /\.(jpeg|jpg|png|webp|gif|jfif|avif|bmp|svg|heic|heif)$/i;
    const isImageMime = Boolean(file.mimetype && file.mimetype.startsWith("image/"));
    const isImageExt = extAllowed.test(file.originalname || "");

    if (isImageMime || isImageExt) {
        cb(null, true);
    } else {
        cb(new Error("Please choose a valid image file (JPG, PNG, WEBP, GIF, AVIF, etc.)."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max for high-res photos
});

// POST /api/upload
router.post("/", (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || "Upload failed." });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }
        res.status(201).json({
            imageUrl: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
        });
    });
});

module.exports = router;
