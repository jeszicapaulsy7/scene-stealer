const mongoose = require("mongoose");

const pieceSchema = new mongoose.Schema(
    {
        imageUrl: { type: String, default: "", trim: true },
        note: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const lookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Look title is required"],
            trim: true,
        },
        occasion: {
            type: String,
            default: "Everyday Chic",
            trim: true,
        },
        vibe: {
            type: String,
            default: "",
            trim: true,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        pieces: {
            outfit: { type: pieceSchema, default: () => ({}) },
            makeup: { type: pieceSchema, default: () => ({}) },
            heels: { type: pieceSchema, default: () => ({}) },
            bag: { type: pieceSchema, default: () => ({}) },
            accessories: { type: pieceSchema, default: () => ({}) },
            hairstyle: { type: pieceSchema, default: () => ({}) },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Look", lookSchema);
