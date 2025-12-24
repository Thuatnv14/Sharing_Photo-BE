const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AdminRouter = require("./routes/AdminRouter");
const CommentRouter = require("./routes/CommentRouter");
const session = require('express-session');

dbConnect();

app.use(cors());
app.use(express.json());

app.use(session({
    secret: 'photo_app_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

app.use("/admin", AdminRouter)
// app.use("/users", isAuthenticated, UserRouter);
app.use("/photos", isAuthenticated,  PhotoRouter);
app.use("/commentsOfPhoto", isAuthenticated, CommentRouter);
app.use("/users/list", isAuthenticated, UserRouter);
app.use("/users/:id", isAuthenticated, UserRouter);
app.use("/users/:id/comments", isAuthenticated, UserRouter);
app.use("/users", UserRouter); // ← POST /users không auth


app.get("/", (request, response) => {
    response.send({ message: "Hello from photo-sharing app API!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});
