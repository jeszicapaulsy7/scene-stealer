const mongoose = require("mongoose");

const moodboardItemSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["photo", "quote", "outfit", "note"],
            required: true,
        },
        title: {
            type: String,
            default: "",
            trim: true,
        },
        content: {
            type: String,
            default: "",
            trim: true,
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        images: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

const moodboardSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Board title is required"],
            trim: true,
        },
        mood: {
            type: String,
            default: "Main character",
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        musicUrl: {
            type: String,
            default: "",
            trim: true,
        },
        colors: {
            type: [String],
            default: ["#c49a70", "#2c221d", "#e8dfd5", "#191817"],
        },
        items: {
            type: [moodboardItemSchema],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Moodboard", moodboardSchema);
