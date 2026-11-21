const mongoose = require("mongoose");

const diaryEntrySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Entry title is required"],
            trim: true,
        },
        date: {
            type: String,
            default: () => new Date().toISOString().slice(0, 10),
        },
        mood: {
            type: String,
            default: "Main character",
            trim: true,
        },
        movieReference: {
            type: String,
            default: "",
            trim: true,
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },
        entry: {
            type: String,
            required: [true, "Journal entry is required"],
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DiaryEntry", diaryEntrySchema);
