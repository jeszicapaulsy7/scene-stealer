const express = require("express");
const DiaryEntry = require("../models/DiaryEntry");

const router = express.Router();

// GET /api/diary
router.get("/", async (req, res) => {
    try {
        const entries = await DiaryEntry.find().sort({ date: -1, createdAt: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch diary entries", error: error.message });
    }
});

// POST /api/diary
router.post("/", async (req, res) => {
    try {
        const { title, date, mood, movieReference, imageUrl, entry } = req.body;
        if (!title || !entry) {
            return res.status(400).json({ message: "Title and journal entry are required." });
        }

        const created = await DiaryEntry.create({
            title: title.trim(),
            date: date || new Date().toISOString().slice(0, 10),
            mood: mood ? mood.trim() : "Main character",
            movieReference: movieReference ? movieReference.trim() : "",
            imageUrl: imageUrl ? imageUrl.trim() : "",
            entry: entry.trim(),
        });

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: "Failed to save diary entry", error: error.message });
    }
});

// DELETE /api/diary/:id
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await DiaryEntry.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Entry not found" });
        }
        res.json({ message: "Diary entry deleted", id: deleted._id });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete diary entry", error: error.message });
    }
});

module.exports = router;
