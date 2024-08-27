const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/todo-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Definir el esquema de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Definir el modelo de usuario
const User = mongoose.model('User', userSchema);

// Definir el esquema de tarea (To-Do)
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  username: { type: String, required: true },
});

// Definir el modelo de tarea
const Todo = mongoose.model('Todo', todoSchema);

app.use(express.json());

// Middleware para verificar la autenticación mediante JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);  // No se envió token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);  // El token es inválido
    req.user = user;
    next();
  });
}

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  console.log('Intento de registro:', req.body);
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('Usuario registrado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar el usuario');
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(400).send('Usuario no encontrado');

  try {
    if (await bcrypt.compare(password, user.password)) {
      const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
      res.json({ accessToken, username: user.username });  // Devolver también el nombre de usuario
    } else {
      res.send('Contraseña incorrecta');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al iniciar sesión');
  }
});

// Proteger rutas con la autenticación
app.use('/api/todos', authenticateToken);

// Rutas para manejar las tareas (To-Dos)
app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find({ username: req.user.username });
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    username: req.user.username,
  });
  await todo.save();
  res.status(201).json(todo);
});

app.put('/api/todos/:id', async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, username: req.user.username },
    { text: req.body.text },
    { new: true }
  );

  if (todo) {
    res.json(todo);
  } else {
    res.status(404).send('Tarea no encontrada o no tiene permiso para modificarla');
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const result = await Todo.deleteOne({ _id: req.params.id, username: req.user.username });
  if (result.deletedCount > 0) {
    res.status(204).send();
  } else {
    res.status(404).send('Tarea no encontrada o no tiene permiso para eliminarla');
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Definir la ruta raíz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
