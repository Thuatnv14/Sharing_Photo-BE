const express = require("express");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");
const router = express.Router();
const mongoose = require("mongoose");

// API 1: /user/list → danh sách user cho sidebar
router.get("/list", async (req, res) => {
    try {
        const users = await User.find({})
            .select("_id first_name last_name")
            .sort({ last_name: 1, first_name: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API 2: /user/:id → chi tiết 1 user
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "_id first_name last_name location description occupation"
        );

        if (!user) {
            return res.status(400).json({ message: "Cannot find user" });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: "Invalid user ID" });
    }
});

router.get("/admin/userlist", async (req, res) => {
    try {
        const users = await User.find({})
            .select("_id first_name last_name")
            .sort({ last_name: 1, first_name: 1 });

        const result = await Promise.all(
            users.map(async (user) => {
                const userObj = user.toObject();
                const photoCount = await Photo.countDocuments({ user_id: user._id });
                const commentResult = await Photo.aggregate([
                    { $unwind: "$comments" },
                    {
                        $match: {

                            "comments.user_id": new mongoose.Types.ObjectId(user._id),
                        },
                    },
                    { $count: "total" },
                ]);

                const commentCount =
                    commentResult.length > 0 ? commentResult[0].total : 0;

                userObj.photo_count = photoCount;
                userObj.comment_count = commentCount;

                return userObj;
            })
        );

        res.json(result);
    } catch (error) {
        console.error("Error /admin/userlist:", error);
        res.status(500).json({ message: error.message });
    }
});
// API 4: Lấy chi tiết comment của user
router.get("/commentsOfUser/:id", async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid User ID" });
    }

    try {
        const comments = await Photo.aggregate([
            { $unwind: "$comments" },
            {
                $match: {
                    "comments.user_id": new mongoose.Types.ObjectId(id),
                },
            },
            {
                $project: {
                    _id: 0,
                    photo_id: "$_id",
                    file_name: "$file_name",
                    user_id: "$user_id",
                    comment_id: "$comments._id",
                    comment_text: "$comments.comment",
                    date_time: "$comments.date_time",
                },
            },
        ]);

        res.json(comments);
    } catch (error) {
        console.error("Error in /commentsOfUser:", error);
        res.status(500).json({ message: "Error fetching comments" });
    }
});
module.exports = router;
