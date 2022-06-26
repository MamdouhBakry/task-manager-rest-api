const Task = require("../models/task");
// function to create task
exports.createTask = (req, res) => {

    const { title, description, periority, status, startDate, endDate } = req.body;
    const createdBy = req.user._id;
    if (!title || !description || !periority || !status || !startDate || !endDate) {
        res.status(400).json({ message: "some field is empty" })
    } else {
        const task = new Task({
            title: title,
            description: description,
            periority,
            status,
            startDate,
            endDate,
            createdBy
        });
        task.save((error, task) => {
            if (error) return res.status(400).json({ error });
            if (task) {
                res.status(201).json({ task });
            }
        });
    }
};

// function to get all tasks created by specific user
exports.getTasks = async (req, res) => {
    const tasks = await Task.find({ createdBy: req.user._id }).exec((error, tasks) => {
        if (error) return res.status(400).json({ error })
        if (tasks) {
            let todo = tasks.filter((task) => task.status == "todo");
            let inProgress = tasks.filter((task) => task.status == "inProgress");
            let underReview = tasks.filter((task) => task.status == "underReview");
            let rework = tasks.filter((task) => task.status == "rework");
            let completed = tasks.filter((task) => task.status == "completed");
            res.status(200).json({ todo, inProgress, underReview, rework, completed });
        }
    });
}

// function to delete task by id 

exports.deleteTask = (req, res) => {

    const id = req.params.taskId;
    if (id) {
        Task.deleteOne({ _id: id }).exec((error, result) => {
            if (error) return res.status(400).json({ error });
            if (result) {
                res.status(202).json({ message: "deleted successfully" });
            }
        });
    } else {
        res.status(400).json({ error: "Params required" });
    }
}

// function to update task by id

exports.updateTask = (req, res) => {

    const id = req.params.taskId;
    const { title, description, periority, status, startDate, endDate } = req.body
    const createdBy = req.user._id;
    if (id) {
        Task.updateOne({ _id: id }, { $set: { title, description, periority, status, startDate, endDate, createdBy } }).exec((error, result) => {
            if (error) return res.status(400).json({ error })
            else {
                res.status(202).json({ updatedTask: result })
            }
        })
    } else {
        res.status(400).json({ error: "Params required" });
    }
}