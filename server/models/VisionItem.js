const mongoose = require("mongoose");

const visionItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Vision title is required"],
            trim: true,
        },
        pillar: {
            type: String,
            required: [true, "Life pillar is required"],
            enum: [
                "Lifestyle",
                "Career",
                "Fashion",
                "Travel",
                "Home",
                "Hobbies",
                "Goals",
            ],
        },
        affirmation: {
            type: String,
            default: "",
            trim: true,
        },
        targetDate: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["Dreaming", "In Progress", "Manifested"],
            default: "Dreaming",
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("VisionItem", visionItemSchema);
