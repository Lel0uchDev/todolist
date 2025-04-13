import React, { useState, useEffect } from "react";
import axios from 'axios';

const API_URL = 'http://localhost:5500/api';

function ToDoList() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const [editText, setEditText] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [groups, setGroups] = useState([""]);
    const [newGroup, setNewGroup] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("All");
    const [editingGroup, setEditingGroup] = useState(null);
    const [editGroupText, setEditGroupText] = useState("");

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks`);
            setTasks(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    };

    async function addTask() {
        if (newTask.trim() !== "" && selectedGroup !== "All") {
            try {
                const response = await axios.post(`${API_URL}/tasks`, { 
                    text: newTask,
                    group: selectedGroup
                });
                await fetchTasks();
                setNewTask("");
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
    }

    async function deleteTask(id) {
        try {
            await axios.delete(`${API_URL}/tasks/${id}`);
            setTasks(tasks.filter(task => task._id !== id));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    async function moveTaskUp(id) {
        try {
            const response = await axios.put(`${API_URL}/tasks/${id}/move`, { direction: 'up' });
            setTasks(response.data);
        } catch (error) {
            console.error('Error moving task up:', error);
        }
    }

    async function moveTaskDown(id) {
        try {
            const response = await axios.put(`${API_URL}/tasks/${id}/move`, { direction: 'down' });
            setTasks(response.data);
        } catch (error) {
            console.error('Error moving task down:', error);
        }
    }

    async function editTask(id) {
        try {
            await axios.put(`${API_URL}/tasks/${id}`, { 
                text: editText,
                group: selectedGroup
            });
            await fetchTasks();
            setEditingTask(null);
            setEditText("");
        } catch (error) {
            console.error('Error editing task:', error);
        }
    }

    function startEditing(task) {
        setEditingTask(task._id);
        setEditText(task.text);
    }

    function handleInputChange(event) {
        setNewTask(event.target.value);
    }

    function handleGroupInputChange(event) {
        setNewGroup(event.target.value);
    }

    function handleEditGroupInputChange(event) {
        setEditGroupText(event.target.value);
    }

    function addGroup() {
        if (newGroup.trim() !== "" && !groups.includes(newGroup.trim())) {
            setGroups([...groups, newGroup.trim()]);
            setNewGroup("");
        }
    }

    function deleteGroup(group) {
        if (group !== "All") {
            setGroups(groups.filter(g => g !== group));
            if (selectedGroup === group) {
                setSelectedGroup("All");
            }
            // Delete all tasks in this group
            tasks.forEach(task => {
                if (task.group === group) {
                    deleteTask(task._id);
                }
            });
        }
    }

    function startEditingGroup(group) {
        setEditingGroup(group);
        setEditGroupText(group);
    }

    function saveGroupEdit() {
        if (editGroupText.trim() !== "" && !groups.includes(editGroupText.trim())) {
            const newGroups = groups.map(g => g === editingGroup ? editGroupText.trim() : g);
            setGroups(newGroups);
            if (selectedGroup === editingGroup) {
                setSelectedGroup(editGroupText.trim());
            }
            // Update all tasks in this group
            tasks.forEach(task => {
                if (task.group === editingGroup) {
                    axios.put(`${API_URL}/tasks/${task._id}`, { 
                        text: task.text,
                        group: editGroupText.trim()
                    });
                }
            });
            setEditingGroup(null);
            setEditGroupText("");
        }
    }

    function moveGroupUp(index) {
        if (index > 0) {
            const newGroups = [...groups];
            [newGroups[index], newGroups[index - 1]] = [newGroups[index - 1], newGroups[index]];
            setGroups(newGroups);
        }
    }

    function moveGroupDown(index) {
        if (index < groups.length - 1) {
            const newGroups = [...groups];
            [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
            setGroups(newGroups);
        }
    }

    function handleGroupKeyPress(event) {
        if (event.key === 'Enter') {
            addGroup();
        }
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    }

    const filteredTasks = selectedGroup === "All" 
        ? tasks 
        : tasks.filter(task => task.group === selectedGroup);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-white flex items-center justify-center">
                <div className="text-blue-800">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-white flex">
            {/* Sidebar */}
            <div className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-800">Groups</h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="New group..."
                                value={newGroup}
                                onChange={handleGroupInputChange}
                                onKeyPress={handleGroupKeyPress}
                                className="flex-1 px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={addGroup}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedGroup("All")}
                            className={`w-full text-left px-3 py-2 rounded-lg ${selectedGroup === "All" ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            All Tasks
                        </button>
                        {groups.map((group, index) => (
                            <div key={group} className="group relative">
                                {editingGroup === group ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editGroupText}
                                            onChange={handleEditGroupInputChange}
                                            className="flex-1 px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={saveGroupEdit}
                                            className="px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingGroup(null);
                                                setEditGroupText("");
                                            }}
                                            className="px-2 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => setSelectedGroup(group)}
                                            className={`flex-1 text-left px-3 py-2 rounded-lg ${selectedGroup === group ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {group}
                                        </button>
                                        <div className="absolute right-0 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => moveGroupUp(index)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                disabled={index === 0}
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveGroupDown(index)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                disabled={index === groups.length - 1}
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => startEditingGroup(group)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                onClick={() => deleteGroup(group)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded-lg"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed left-4 top-4 bg-white p-2 rounded-lg shadow-md hover:shadow-lg"
                    >
                        ☰
                    </button>
                )}
                
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-blue-800 mb-2">To-Do List</h1>
                        <p className="text-blue-600">Organize your tasks efficiently</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={`Enter a task for ${selectedGroup}...`}
                                value={newTask}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                onClick={addTask}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!newTask.trim() || selectedGroup === "All"}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredTasks.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                                {selectedGroup === "All" 
                                    ? "No tasks yet. Add a task to get started!" 
                                    : `No tasks in ${selectedGroup}. Add a task to get started!`}
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <div 
                                    key={task._id}
                                    className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between group hover:shadow-lg"
                                >
                                    {editingTask === task._id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="flex-1 px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => editTask(task._id)}
                                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingTask(null);
                                                    setEditText("");
                                                }}
                                                className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-800 font-medium">{task.text}</span>
                                                {selectedGroup === "All" && (
                                                    <span className="text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        ({task.group})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                                                <button 
                                                    onClick={() => moveTaskUp(task._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={tasks.findIndex(t => t._id === task._id) === 0}
                                                >
                                                    ↑
                                                </button>
                                                <button 
                                                    onClick={() => moveTaskDown(task._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={tasks.findIndex(t => t._id === task._id) === tasks.length - 1}
                                                >
                                                    ↓
                                                </button>
                                                <button 
                                                    onClick={() => startEditing(task)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                >
                                                    ✎
                                                </button>
                                                <button 
                                                    onClick={() => deleteTask(task._id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ToDoList;
