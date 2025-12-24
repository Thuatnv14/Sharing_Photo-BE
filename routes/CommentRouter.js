const express = require("express");
const router = express.Router();
const Photo = require("../db/photoModel");
const mongoose = require("mongoose");

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};
//POST /commentsOfPhoto/:photo_id
router.post("/:photo_id", isAuthenticated, async (req, res) => {
    const { photo_id } = req.params;
    const { comment } = req.body;

    if (!mongoose.isValidObjectId(photo_id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
    }

    if (!comment || comment.trim() === "") {
        return res.status(400).json({ message: "Comment cannot be empty" });
    }

    try {
        const photo = await Photo.findById(photo_id);
        if (!photo) {
            return res.status(400).json({ message: "Photo not found" });
        }

        const newComment = {
            comment: comment.trim(),
            date_time: new Date(),
            user_id: req.session.userId
        };

        photo.comments.push(newComment);
        await photo.save();

        // Lấy comment mới với populate
        const populatedPhoto = await Photo.findById(photo_id)
            .populate('comments.user_id', 'first_name last_name _id')
            .lean();

        const addedComment = populatedPhoto.comments[populatedPhoto.comments.length - 1];

        res.status(201).json({
            _id: addedComment._id,
            comment: addedComment.comment,
            date_time: addedComment.date_time,
            user: {
                _id: addedComment.user_id._id,
                first_name: addedComment.user_id.first_name,
                last_name: addedComment.user_id.last_name
            }
        });
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
