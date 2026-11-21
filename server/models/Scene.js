const mongoose = require("mongoose");

const sceneSchema = new mongoose.Schema(
    {
        sceneNumber: {
            type: Number,
            default: 1,
        },
        title: {
            type: String,
            required: [true, "Scene title is required"],
            trim: true,
        },
        movie: {
            type: String,
            required: [true, "Movie or TV show name is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: [
                "Fashion",
                "Beauty",
                "Music",
                "Lifestyle",
                "Aesthetic",
                "Movies & TV",
                "Character Inspiration",
            ],
        },
        moods: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        everydayInspiration: {
            type: String,
            default: "",
            trim: true,
        },
        recreateVibe: {
            outfit: { type: String, default: "", trim: true },
            makeup: { type: String, default: "", trim: true },
            hairstyle: { type: String, default: "", trim: true },
            activity: { type: String, default: "", trim: true },
            music: { type: String, default: "", trim: true },
        },
        tags: {
            type: [String],
            default: [],
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        imagePosition: {
            type: String,
            default: "50% 15%",
            trim: true,
        },
        imageFit: {
            type: String,
            enum: ["cover", "contain"],
            default: "cover",
        },
        personalNotes: {
            type: String,
            default: "",
            trim: true,
        },
        musicUrl: {
            type: String,
            default: "",
            trim: true,
        },
        musicPlatform: {
            type: String,
            default: "",
            trim: true,
        },
        isUserCreated: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Scene", sceneSchema);