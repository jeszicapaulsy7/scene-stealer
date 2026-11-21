const express = require("express");
const Look = require("../models/Look");

const router = express.Router();

function normalizePieces(pieces = {}) {
    const keys = ["outfit", "makeup", "heels", "bag", "accessories", "hairstyle"];
    const result = {};
    for (const key of keys) {
        const slot = pieces[key] || {};
        result[key] = {
            imageUrl: slot.imageUrl ? String(slot.imageUrl).trim() : "",
            note: slot.note ? String(slot.note).trim() : "",
        };
    }
    return result;
}

// GET /api/looks
router.get("/", async (req, res) => {
    try {
        const looks = await Look.find().sort({ createdAt: -1 });
        res.json(looks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch looks", error: error.message });
    }
});

// POST /api/looks
router.post("/", async (req, res) => {
    try {
        const { title, occasion, vibe, notes, pieces } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Look title is required." });
        }

        const created = await Look.create({
            title: title.trim(),
            occasion: occasion ? String(occasion).trim() : "Everyday Chic",
            vibe: vibe ? String(vibe).trim() : "",
            notes: notes ? String(notes).trim() : "",
            pieces: normalizePieces(pieces),
        });

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: "Failed to create look", error: error.message });
    }
});

// PUT /api/looks/:id
router.put("/:id", async (req, res) => {
    try {
        const { title, occasion, vibe, notes, pieces } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Look title is required." });
        }

        const updated = await Look.findByIdAndUpdate(
            req.params.id,
            {
                title: title.trim(),
                occasion: occasion ? String(occasion).trim() : "Everyday Chic",
                vibe: vibe ? String(vibe).trim() : "",
                notes: notes ? String(notes).trim() : "",
                pieces: normalizePieces(pieces),
            },
            { returnDocument: "after", runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Look not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Failed to update look", error: error.message });
    }
});

// DELETE /api/looks/:id
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Look.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Look not found" });
        }
        res.json({ message: "Look deleted successfully", id: deleted._id });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete look", error: error.message });
    }
});

module.exports = router;
