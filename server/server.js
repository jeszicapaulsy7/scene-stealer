const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Scene = require("./models/Scene");
const Pose = require("./models/Pose");
const Moodboard = require("./models/Moodboard");
const VisionItem = require("./models/VisionItem");
const seedScenes = require("./data/seedScenes");
const seedPoses = require("./data/seedPoses");
const sceneRoutes = require("./routes/sceneRoutes");
const poseRoutes = require("./routes/poseRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const moodboardRoutes = require("./routes/moodboardRoutes");
const diaryRoutes = require("./routes/diaryRoutes");
const visionRoutes = require("./routes/visionRoutes");
const lookRoutes = require("./routes/lookRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;

// Health check route (useful for Render / hosting platforms)
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

// API routes
app.use("/api/scenes", sceneRoutes);
app.use("/api/poses", poseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/moodboards", moodboardRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/looks", lookRoutes);

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// Serve built React frontend in production (when client/dist exists)
const clientDistPath = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.use((req, res) => {
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("Scene Stealer Server is running!");
    });
}

async function seedDatabaseIfEmpty() {
    const sceneCount = await Scene.countDocuments();
    if (sceneCount === 0) {
        await Scene.insertMany(seedScenes);
        console.log(`Seeded ${seedScenes.length} starter scenes into MongoDB.`);
    } else {
        let updated = 0;
        for (const starter of seedScenes) {
            const existing = await Scene.findOne({
                title: starter.title,
                isUserCreated: { $ne: true },
            });
            if (existing && (!existing.recreateVibe || !existing.recreateVibe.outfit)) {
                existing.recreateVibe = starter.recreateVibe;
                await existing.save();
                updated++;
            }
        }
        if (updated > 0) {
            console.log(`Updated ${updated} starter scenes with Recreate the Vibe guides.`);
        }
    }

    const poseCount = await Pose.countDocuments();
    if (poseCount === 0) {
        await Pose.insertMany(seedPoses);
        console.log(`Seeded ${seedPoses.length} starter poses into MongoDB.`);
    }

    const boardCount = await Moodboard.countDocuments();
    if (boardCount === 0) {
        await Moodboard.insertMany([
            {
                title: "Parisian Autumn Editorial",
                mood: "Romantic",
                description: "Warm streetlights, espresso mornings, cashmere knits, and slow cinema days.",
                colors: ["#c49a70", "#5c3d2e", "#e8dfd5", "#241d1a", "#8d6e53"],
                items: [
                    {
                        type: "quote",
                        title: "Main Character Reminder",
                        content: "Romanticize the quiet hours — the morning coffee, the rain on the glass, the walk home.",
                    },
                    {
                        type: "outfit",
                        title: "Rainy Café Uniform",
                        content: "Camel wool trench, cream ribbed turtleneck, dark straight denim, leather loafers, gold hoops.",
                    },
                    {
                        type: "note",
                        title: "Weekend Ritual",
                        content: "Bring a paperback to a corner café, turn on soft jazz, and write three pages by hand.",
                    },
                ],
            },
            {
                title: "Dark Feminine After Hours",
                mood: "Dark feminine",
                description: "Velvet silhouettes, candlelit dinners, sharp composure, and timeless gold.",
                colors: ["#4a1525", "#141211", "#c49a70", "#6e5a4f", "#d9cfc5"],
                items: [
                    {
                        type: "quote",
                        title: "Energy",
                        content: "Move slowly, speak softly, and let your presence do the talking.",
                    },
                    {
                        type: "outfit",
                        title: "Evening Look",
                        content: "Black silk slip dress, structured tailored blazer draped over shoulders, sheer tights, vintage gold rings.",
                    },
                ],
            },
        ]);
        console.log("Seeded starter moodboards into MongoDB.");
    }

    const visionCount = await VisionItem.countDocuments();
    if (visionCount === 0) {
        await VisionItem.insertMany([
            {
                title: "Sunlit Creative Apartment",
                pillar: "Home",
                affirmation: "Warm hardwood floors, floor-to-ceiling bookshelves, fresh flowers every Sunday, and soft evening lamps.",
                targetDate: "2027",
                status: "Dreaming",
            },
            {
                title: "Autumn Week in Paris & Milan",
                pillar: "Travel",
                affirmation: "Morning pastries, art galleries, vintage boutiques, and golden-hour walks with a film camera.",
                targetDate: "Next Year",
                status: "In Progress",
            },
            {
                title: "Curated Capsule Wardrobe",
                pillar: "Fashion",
                affirmation: "Timeless tailored coats, silk basics, and effortless everyday silhouettes that feel unmistakably me.",
                targetDate: "This Season",
                status: "In Progress",
            },
        ]);
        console.log("Seeded starter vision board items into MongoDB.");
    }
}

// Connect MongoDB and start server
mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("MongoDB connected successfully!");
        await seedDatabaseIfEmpty();

        app.listen(PORT, () => {
            console.log(`Scene Stealer server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });
