const express = require("express");
const VisionItem = require("../models/VisionItem");

const router = express.Router();

// GET /api/vision
router.get("/", async (req, res) => {
    try {
        const items = await VisionItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch vision items", error: error.message });
    }
});

// POST /api/vision
router.post("/", async (req, res) => {
    try {
        const { title, pillar, affirmation, targetDate, status, imageUrl } = req.body;
        if (!title || !pillar) {
            return res.status(400).json({ message: "Title and life pillar are required." });
        }

        const created = await VisionItem.create({
            title: title.trim(),
            pillar,
            affirmation: affirmation ? affirmation.trim() : "",
            targetDate: targetDate ? targetDate.trim() : "",
            status: status || "Dreaming",
            imageUrl: imageUrl ? imageUrl.trim() : "",
        });

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: "Failed to create vision item", error: error.message });
    }
});

// PATCH /api/vision/:id
router.patch("/:id", async (req, res) => {
    try {
        const { status, title, affirmation, targetDate, pillar, imageUrl } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (title !== undefined) updates.title = title.trim();
        if (affirmation !== undefined) updates.affirmation = affirmation.trim();
        if (targetDate !== undefined) updates.targetDate = targetDate.trim();
        if (pillar) updates.pillar = pillar;
        if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();

        const updated = await VisionItem.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            return res.status(404).json({ message: "Vision item not found" });
        }
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Failed to update vision item", error: error.message });
    }
});

// DELETE /api/vision/:id
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await VisionItem.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Vision item not found" });
        }
        res.json({ message: "Vision item deleted", id: deleted._id });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete vision item", error: error.message });
    }
});

module.exports = router;
