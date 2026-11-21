const express = require("express");
const Moodboard = require("../models/Moodboard");

const router = express.Router();

// GET /api/moodboards
router.get("/", async (req, res) => {
    try {
        const boards = await Moodboard.find().sort({ createdAt: -1 });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch moodboards", error: error.message });
    }
});

// POST /api/moodboards
router.post("/", async (req, res) => {
    try {
        const { title, mood, description, musicUrl, colors, photos } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Board title is required." });
        }

        const cleanPhotos = Array.isArray(photos)
            ? photos.map((p) => String(p).trim()).filter(Boolean).slice(0, 7)
            : [];

        const initialItems = cleanPhotos.map((url) => ({
            type: "photo",
            title: "",
            content: "",
            imageUrl: url,
            images: [url],
        }));

        const board = await Moodboard.create({
            title: title.trim(),
            mood: mood ? mood.trim() : "Main character",
            description: description ? description.trim() : "",
            musicUrl: musicUrl ? String(musicUrl).trim() : "",
            colors:
                Array.isArray(colors) && colors.length > 0
                    ? colors
                    : ["#c49a70", "#2c221d", "#e8dfd5", "#191817"],
            items: initialItems,
        });

        res.status(201).json(board);
    } catch (error) {
        res.status(400).json({ message: "Failed to create moodboard", error: error.message });
    }
});

// PUT /api/moodboards/:id - Edit board details (title, mood, description, musicUrl)
router.put("/:id", async (req, res) => {
    try {
        const { title, mood, description, musicUrl } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Board title is required." });
        }

        const updated = await Moodboard.findByIdAndUpdate(
            req.params.id,
            {
                title: title.trim(),
                mood: mood ? String(mood).trim() : "Main character",
                description: description ? String(description).trim() : "",
                musicUrl: musicUrl ? String(musicUrl).trim() : "",
            },
            { returnDocument: "after", runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Moodboard not found" });
        }
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Failed to update moodboard", error: error.message });
    }
});

// POST /api/moodboards/:id/items
router.post("/:id/items", async (req, res) => {
    try {
        const { type, title, content, imageUrl, images } = req.body;
        const board = await Moodboard.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: "Moodboard not found" });
        }

        const cleanImages = Array.isArray(images)
            ? images.map((u) => String(u).trim()).filter(Boolean).slice(0, 7)
            : [];
        const primaryImage =
            imageUrl && String(imageUrl).trim()
                ? String(imageUrl).trim()
                : cleanImages[0] || "";

        if (primaryImage && cleanImages.length === 0) {
            cleanImages.push(primaryImage);
        }

        board.items.unshift({
            type: type || "note",
            title: title ? title.trim() : "",
            content: content ? content.trim() : "",
            imageUrl: primaryImage,
            images: cleanImages,
        });

        await board.save();
        res.status(201).json(board);
    } catch (error) {
        res.status(400).json({ message: "Failed to add item", error: error.message });
    }
});

// PUT /api/moodboards/:id/items/:itemId - Edit an existing pin
router.put("/:id/items/:itemId", async (req, res) => {
    try {
        const { type, title, content, imageUrl, images } = req.body;
        const board = await Moodboard.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: "Moodboard not found" });
        }

        const pin = board.items.id(req.params.itemId);
        if (!pin) {
            return res.status(404).json({ message: "Pin not found" });
        }

        const cleanImages = Array.isArray(images)
            ? images.map((u) => String(u).trim()).filter(Boolean).slice(0, 7)
            : [];
        const primaryImage =
            imageUrl && String(imageUrl).trim()
                ? String(imageUrl).trim()
                : cleanImages[0] || "";

        if (primaryImage && cleanImages.length === 0) {
            cleanImages.push(primaryImage);
        }

        if (type) pin.type = type;
        pin.title = title !== undefined ? String(title).trim() : pin.title;
        pin.content = content !== undefined ? String(content).trim() : pin.content;
        pin.imageUrl = primaryImage;
        pin.images = cleanImages;

        await board.save();
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: "Failed to update pin", error: error.message });
    }
});

// PATCH /api/moodboards/:id/reorder - Reorder pins
router.patch("/:id/reorder", async (req, res) => {
    try {
        const { fromIndex, toIndex } = req.body;
        const board = await Moodboard.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: "Moodboard not found" });
        }

        if (
            typeof fromIndex !== "number" ||
            typeof toIndex !== "number" ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= board.items.length ||
            toIndex >= board.items.length
        ) {
            return res.status(400).json({ message: "Invalid reorder indices." });
        }

        const [moved] = board.items.splice(fromIndex, 1);
        board.items.splice(toIndex, 0, moved);
        await board.save();
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: "Failed to reorder pins", error: error.message });
    }
});

// DELETE /api/moodboards/:id/items/:itemId
router.delete("/:id/items/:itemId", async (req, res) => {
    try {
        const board = await Moodboard.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: "Moodboard not found" });
        }

        board.items = board.items.filter(
            (item) => item._id.toString() !== req.params.itemId
        );
        await board.save();
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: "Failed to remove item", error: error.message });
    }
});

// PATCH /api/moodboards/:id/colors
router.patch("/:id/colors", async (req, res) => {
    try {
        const { colors } = req.body;
        const board = await Moodboard.findByIdAndUpdate(
            req.params.id,
            { colors: Array.isArray(colors) ? colors : [] },
            { returnDocument: "after" }
        );
        if (!board) {
            return res.status(404).json({ message: "Moodboard not found" });
        }
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: "Failed to update palette", error: error.message });
    }
});

// DELETE /api/moodboards/:id
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Moodboard.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Moodboard not found" });
        }
        res.json({ message: "Moodboard deleted", id: deleted._id });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete moodboard", error: error.message });
    }
});

module.exports = router;
