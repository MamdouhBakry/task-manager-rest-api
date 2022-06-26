const express = require('express');
const mongoose = require('mongoose');
const env = require('dotenv');
const app = express();
const cors = require('cors');

// Routes
const userRoutes = require('./routes/user');
const taskRoutes = require('./routes/task');
const verificationRoutes = require('./routes/userVerification');


// environment variable or you can say constants
env.config();

// Database connection
mongoose
    .connect(
        `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.ipjag.mongodb.net/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`
    )
    .then(() => {
        console.log("Database Connected");
    });

const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use("/api", userRoutes);
app.use("/api", taskRoutes);
app.use("/api", verificationRoutes);
// strat function to create server
const start = async () => {
    try {
        await app.listen(port, () => {
            console.log("app is listen on port 5000...");
        })
    } catch (error) {
        console.log(error);
    }
}
start();