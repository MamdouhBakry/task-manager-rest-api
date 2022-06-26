const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            min: 3,
            max: 20,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            min: 3,
            max: 20,
        },
        periority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "low",
        },
        status: {
            type: String,
            enum: ["todo", "inProgress", "underReview", "rework", "completed"],
            default: "todo",
        },
        startDate: {
            type: Date,
            requires: true
        },
        endDate: {
            type: Date,
            requires: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
