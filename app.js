const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const users = [];  // En un entorno real, esto debería estar en una base de datos

app.use(express.json());

// Middleware para verificar la autenticación mediante JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
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
    users.push({ username, password: hashedPassword });
    res.status(201).send('Usuario registrado');
  } catch {
    res.status(500).send('Error al registrar el usuario');
  }
});

app.post('/api/login', async (req, res) => {
  console.log('Intento de login:', req.body);
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);

  if (!user) return res.status(400).send('Usuario no encontrado');
  
  try {
    if (await bcrypt.compare(password, user.password)) {
      const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
      res.json({ accessToken });
    } else {
      res.send('Contraseña incorrecta');
    }
  } catch {
    res.status(500).send('Error al iniciar sesión');
  }
});

// Proteger rutas con la autenticación
app.use('/api/todos', authenticateToken);

// Definir la ruta raíz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
