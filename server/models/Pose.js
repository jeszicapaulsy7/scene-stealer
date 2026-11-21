const mongoose = require("mongoose");

const poseSchema = new mongoose.Schema(
    {
        poseNumber: {
            type: Number,
            default: 1,
        },
        title: {
            type: String,
            required: [true, "Pose title is required"],
            trim: true,
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            enum: [
                "Café",
                "Street / City",
                "Mirror",
                "Golden Hour / Outdoor",
                "Seated / Lounge",
                "Night Out",
            ],
        },
        vibe: {
            type: String,
            default: "Editorial",
            trim: true,
        },
        cameraAngle: {
            type: String,
            required: [true, "Camera angle is required"],
            trim: true,
        },
        bodyPosition: {
            type: String,
            required: [true, "Body position is required"],
            trim: true,
        },
        handPlacement: {
            type: String,
            required: [true, "Hand placement is required"],
            trim: true,
        },
        proTip: {
            type: String,
            default: "",
            trim: true,
        },
        imageUrl: {
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

module.exports = mongoose.model("Pose", poseSchema);
