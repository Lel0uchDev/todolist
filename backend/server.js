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

// Group Schema
const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    order: { type: Number, required: true }
});

// Task Schema
const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    order: { type: Number, required: true },
    group: { type: String, required: true, ref: 'Group' }
});

const Group = mongoose.model('Group', groupSchema);
const Task = mongoose.model('Task', taskSchema);

// Group Routes
app.get('/api/groups', async (req, res) => {
    try {
        const groups = await Group.find().sort('order');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/groups', async (req, res) => {
    try {
        const count = await Group.countDocuments();
        const group = new Group({
            name: req.body.name,
            order: count
        });
        const newGroup = await group.save();
        res.status(201).json(newGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/groups/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (group) {
            group.name = req.body.name;
            const updatedGroup = await group.save();
            res.json(updatedGroup);
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/groups/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (group) {
            await Task.deleteMany({ group: group.name });
            await Group.findByIdAndDelete(req.params.id);
            res.json({ message: 'Group deleted' });
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/groups/:id/move', async (req, res) => {
    try {
        const { direction } = req.body;
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groups = await Group.find().sort('order');
        const currentIndex = groups.findIndex(g => g._id.toString() === req.params.id);

        if (direction === 'up' && currentIndex > 0) {
            [groups[currentIndex].order, groups[currentIndex - 1].order] = 
            [groups[currentIndex - 1].order, groups[currentIndex].order];
        } else if (direction === 'down' && currentIndex < groups.length - 1) {
            [groups[currentIndex].order, groups[currentIndex + 1].order] = 
            [groups[currentIndex + 1].order, groups[currentIndex].order];
        }

        await Promise.all(groups.map(g => g.save()));
        res.json(await Group.find().sort('order'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Task Routes
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
        const { text, group } = req.body;
        const count = await Task.countDocuments({ group });
        const task = new Task({
            text,
            order: count,
            group
        });
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            task.text = req.body.text;
            const updatedTask = await task.save();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            await task.remove();
            res.json({ message: 'Task deleted' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const currentIndex = tasks.findIndex(t => t._id.toString() === req.params.id);

        if (direction === 'up' && currentIndex > 0) {
            [tasks[currentIndex].order, tasks[currentIndex - 1].order] = 
            [tasks[currentIndex - 1].order, tasks[currentIndex].order];
        } else if (direction === 'down' && currentIndex < tasks.length - 1) {
            [tasks[currentIndex].order, tasks[currentIndex + 1].order] = 
            [tasks[currentIndex + 1].order, tasks[currentIndex].order];
        }

        await Promise.all(tasks.map(t => t.save()));
        res.json(await Task.find({ group: task.group }).sort('order'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 