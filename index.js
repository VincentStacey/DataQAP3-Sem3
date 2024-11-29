const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;
const { MongoClient } = require('mongodb');

app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'DataQAP3',
    password: 'QAP123',
    port: 5432,
});

const mongoUri = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUri);
const dbName = 'library_db';
let booksCollection;

const setupMongo = async () => {
    try {
        await mongoClient.connect();
        const db = mongoClient.db(dbName);
        booksCollection = db.collection('books');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};
setupMongo();

const createTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            description TEXT NOT NULL,
            status TEXT NOT NULL
        );
    `);
};
createTable().catch(console.error);

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /tasks - Add a new task
app.post('/tasks', async (req, res) => {
    const { description, status } = req.body;
    if (!description || !status) {
        return res.status(400).json({ error: 'All fields (description, status) are required' });
    }

    try {
        await pool.query('INSERT INTO tasks (description, status) VALUES ($1, $2)', [description, status]);
        res.status(201).json({ message: 'Task added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /tasks/:id - Update a task's status
app.put('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;

    try {
        const result = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, taskId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id, 10);

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
