const express = require("express");
const Pose = require("../models/Pose");

const router = express.Router();

// GET /api/poses - Get all poses with optional filtering
router.get("/", async (req, res) => {
    try {
        const { location, search } = req.query;
        const filter = {};

        if (location && location !== "All") {
            filter.location = location;
        }
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { title: regex },
                { location: regex },
                { vibe: regex },
                { cameraAngle: regex },
                { bodyPosition: regex },
                { handPlacement: regex },
                { proTip: regex },
            ];
        }

        const poses = await Pose.find(filter).sort({ poseNumber: 1, createdAt: -1 });
        res.json(poses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch poses", error: error.message });
    }
});

// POST /api/poses - Create a new pose
router.post("/", async (req, res) => {
    try {
        const {
            title,
            location,
            vibe,
            cameraAngle,
            bodyPosition,
            handPlacement,
            proTip,
            imageUrl,
        } = req.body;

        if (!title || !location || !cameraAngle || !bodyPosition || !handPlacement) {
            return res.status(400).json({
                message:
                    "Title, location, camera angle, body position, and hand placement are required.",
            });
        }

        const lastPose = await Pose.findOne().sort({ poseNumber: -1 });
        const nextPoseNumber = lastPose && lastPose.poseNumber ? lastPose.poseNumber + 1 : 1;

        const newPose = await Pose.create({
            poseNumber: nextPoseNumber,
            title: title.trim(),
            location,
            vibe: vibe ? vibe.trim() : "Editorial",
            cameraAngle: cameraAngle.trim(),
            bodyPosition: bodyPosition.trim(),
            handPlacement: handPlacement.trim(),
            proTip: proTip ? proTip.trim() : "",
            imageUrl: imageUrl ? imageUrl.trim() : "",
            isUserCreated: true,
        });

        res.status(201).json(newPose);
    } catch (error) {
        res.status(400).json({ message: "Failed to create pose", error: error.message });
    }
});

// DELETE /api/poses/:id - Delete a pose
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Pose.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Pose not found" });
        }
        res.json({ message: "Pose deleted successfully", id: deleted._id });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete pose", error: error.message });
    }
});

module.exports = router;
