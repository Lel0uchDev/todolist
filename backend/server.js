require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Task Schema
const taskSchema = new mongoose.Schema({
    text: String,
    order: Number,
    group: String
});

const Task = mongoose.model('Task', taskSchema);

// API Routes
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort('order');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const count = await Task.countDocuments({ group: req.body.group });
        const task = new Task({
            text: req.body.text,
            order: count,
            group: req.body.group
        });
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            task.text = req.body.text;
            if (req.body.group) {
                task.group = req.body.group;
            }
            const updatedTask = await task.save();
            res.json(updatedTask);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/tasks/:id/move', async (req, res) => {
    try {
        const { direction } = req.body;
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const tasks = await Task.find({ group: task.group }).sort('order');
        const currentIndex = tasks.findIndex(t => t._id.toString() === task._id.toString());
        
        if (direction === 'up' && currentIndex > 0) {
            [tasks[currentIndex].order, tasks[currentIndex - 1].order] = 
            [tasks[currentIndex - 1].order, tasks[currentIndex].order];
        } else if (direction === 'down' && currentIndex < tasks.length - 1) {
            [tasks[currentIndex].order, tasks[currentIndex + 1].order] = 
            [tasks[currentIndex + 1].order, tasks[currentIndex].order];
        }

        await Promise.all(tasks.map(t => t.save()));
        res.json(await Task.find().sort('order'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 