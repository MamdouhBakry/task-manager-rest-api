const express = require("express");
const {
    requireSignin,
    userMiddleware,
} = require("../common-middleware/index");
const {
    createTask,
    getTasks,
    deleteTask,
    updateTask,
} = require("../controllers/task");
const router = express.Router();
router.post(
    "/task/create",
    requireSignin,
    userMiddleware,
    createTask
);
router.get("/task", requireSignin, userMiddleware, getTasks);
router.delete(
    "/task/removeTask/:taskId",
    requireSignin,
    userMiddleware,
    deleteTask
);
router.put(
    "/task/updateTask/:taskId",
    requireSignin,
    userMiddleware,
    updateTask
);

module.exports = router;
