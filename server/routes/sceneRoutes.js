const express = require("express");
const Scene = require("../models/Scene");

const router = express.Router();

function sanitizeImageUrl(url) {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (!/^(https?:\/\/|\/uploads\/)/i.test(trimmed)) {
        throw new Error("Image URL must be an uploaded file or start with http:// or https://");
    }
    return trimmed;
}

function parseTags(tags) {
    if (Array.isArray(tags)) {
        return tags.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof tags === "string") {
        return tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeRecreateVibe(vibe) {
    if (!vibe || typeof vibe !== "object") {
        return { outfit: "", makeup: "", hairstyle: "", activity: "", music: "" };
    }
    return {
        outfit: vibe.outfit ? String(vibe.outfit).trim() : "",
        makeup: vibe.makeup ? String(vibe.makeup).trim() : "",
        hairstyle: vibe.hairstyle ? String(vibe.hairstyle).trim() : "",
        activity: vibe.activity ? String(vibe.activity).trim() : "",
        music: vibe.music ? String(vibe.music).trim() : "",
    };
}

// GET /api/scenes/daily - Deterministic daily inspiration scene
router.get("/daily", async (req, res) => {
    try {
        const scenes = await Scene.find().sort({ sceneNumber: 1, createdAt: 1 });
        if (scenes.length === 0) {
            return res.status(404).json({ message: "No scenes available yet." });
        }

        const today = new Date().toISOString().slice(0, 10);
        let hash = 0;
        for (let i = 0; i < today.length; i++) {
            hash = (hash * 31 + today.charCodeAt(i)) % 100000;
        }
        const dailyScene = scenes[hash % scenes.length];

        res.json({
            date: today,
            scene: dailyScene,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to load daily scene", error: error.message });
    }
});

// GET /api/scenes - Get all scenes with optional filtering
router.get("/", async (req, res) => {
    try {
        const { category, mood, movie, search } = req.query;
        const filter = {};

        if (category && category !== "All") {
            filter.category = category;
        }
        if (mood && mood !== "All") {
            filter.moods = mood;
        }
        if (movie && movie !== "All") {
            filter.movie = movie;
        }
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { title: regex },
                { movie: regex },
                { category: regex },
                { description: regex },
                { tags: regex },
                { moods: regex },
            ];
        }

        const scenes = await Scene.find(filter).sort({
            isUserCreated: -1,
            sceneNumber: 1,
            createdAt: -1,
        });
        res.json(scenes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch scenes", error: error.message });
    }
});

// GET /api/scenes/:id - Get single scene
router.get("/:id", async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.id);
        if (!scene) {
            return res.status(404).json({ message: "Scene not found" });
        }
        res.json(scene);
    } catch (error) {
        res.status(400).json({ message: "Invalid scene ID", error: error.message });
    }
});

// POST /api/scenes - Create a new scene
router.post("/", async (req, res) => {
    try {
        const {
            title,
            movie,
            category,
            moods,
            description,
            everydayInspiration,
            recreateVibe,
            tags,
            imageUrl,
            imagePosition,
            imageFit,
            personalNotes,
            musicUrl,
            musicPlatform,
        } = req.body;

        if (!title || !movie || !category || !description) {
            return res.status(400).json({
                message: "Title, movie/TV show, category, and description are required.",
            });
        }

        const safeImageUrl = sanitizeImageUrl(imageUrl);

        const lastScene = await Scene.findOne().sort({ sceneNumber: -1 });
        const nextSceneNumber = lastScene && lastScene.sceneNumber ? lastScene.sceneNumber + 1 : 1;

        const cleanMoods = Array.isArray(moods)
            ? moods.map((m) => String(m).trim()).filter(Boolean)
            : [];

        const newScene = await Scene.create({
            sceneNumber: nextSceneNumber,
            title: title.trim(),
            movie: movie.trim(),
            category,
            moods: cleanMoods,
            description: description.trim(),
            everydayInspiration: everydayInspiration ? everydayInspiration.trim() : "",
            recreateVibe: normalizeRecreateVibe(recreateVibe),
            tags: parseTags(tags),
            imageUrl: safeImageUrl,
            imagePosition: imagePosition ? String(imagePosition).trim() : "50% 15%",
            imageFit: imageFit === "contain" ? "contain" : "cover",
            personalNotes: personalNotes ? personalNotes.trim() : "",
            musicUrl: musicUrl ? String(musicUrl).trim() : "",
            musicPlatform: musicPlatform ? String(musicPlatform).trim() : "",
            isUserCreated: true,
        });

        res.status(201).json(newScene);
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to create scene" });
    }
});

// PUT /api/scenes/:id - Update an existing scene
router.put("/:id", async (req, res) => {
    try {
        const {
            title,
            movie,
            category,
            moods,
            description,
            everydayInspiration,
            recreateVibe,
            tags,
            imageUrl,
            imagePosition,
            imageFit,
            personalNotes,
            musicUrl,
            musicPlatform,
        } = req.body;

        const updates = {};
        if (title !== undefined) updates.title = String(title).trim();
        if (movie !== undefined) updates.movie = String(movie).trim();
        if (category !== undefined) updates.category = category;
        if (moods !== undefined) {
            updates.moods = Array.isArray(moods)
                ? moods.map((m) => String(m).trim()).filter(Boolean)
                : [];
        }
        if (description !== undefined) updates.description = String(description).trim();
        if (everydayInspiration !== undefined) {
            updates.everydayInspiration = String(everydayInspiration).trim();
        }
        if (recreateVibe !== undefined) {
            updates.recreateVibe = normalizeRecreateVibe(recreateVibe);
        }
        if (tags !== undefined) updates.tags = parseTags(tags);
        if (imageUrl !== undefined) updates.imageUrl = sanitizeImageUrl(imageUrl);
        if (imagePosition !== undefined) {
            updates.imagePosition = String(imagePosition).trim() || "50% 15%";
        }
        if (imageFit !== undefined) {
            updates.imageFit = imageFit === "contain" ? "contain" : "cover";
        }
        if (personalNotes !== undefined) {
            updates.personalNotes = String(personalNotes).trim();
        }
        if (musicUrl !== undefined) updates.musicUrl = String(musicUrl).trim();
        if (musicPlatform !== undefined) updates.musicPlatform = String(musicPlatform).trim();

        const updated = await Scene.findByIdAndUpdate(req.params.id, updates, {
            returnDocument: "after",
            runValidators: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "Scene not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to update scene" });
    }
});

// DELETE /api/scenes/:id - Delete a scene
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Scene.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Scene not found" });
        }
        res.json({ message: "Scene deleted successfully", id: deleted._id });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete scene", error: error.message });
    }
});

module.exports = router;
