const express = require('express');
const router = express.Router();

// Array simulado de tareas
let todos = [];

// Crear una nueva tarea
router.post('/todos', (req, res) => {
  const todo = { id: todos.length + 1, text: req.body.text };
  todos.push(todo);
  res.status(201).json(todo);
});

// Leer todas las tareas
router.get('/todos', (req, res) => {
  res.json(todos);
});

// Actualizar una tarea
router.put('/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const todo = todos.find(t => t.id === todoId);
  if (todo) {
    todo.text = req.body.text;
    res.json(todo);
  } else {
    res.status(404).send('Tarea no encontrada');
  }
});

// Eliminar una tarea
router.delete('/todos/:id', (req, res) => {
  todos = todos.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send();
});

module.exports = router;
