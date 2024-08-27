let accessToken = '';

document.getElementById('registerBtn').addEventListener('click', () => {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(response => {
    if (response.status === 201) {
      alert('Usuario registrado con éxito');
      document.getElementById('registerUsername').value = "";  // Limpiar campo
      document.getElementById('registerPassword').value = "";  // Limpiar campo
    } else {
      alert('Error al registrar usuario');
    }
  }).catch(error => {
    console.error('Error en la solicitud de registro:', error);
  });
});


document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Login fallido');
    }
    return response.json();
  })
  .then(data => {
    accessToken = data.accessToken;
    document.getElementById('addTodo').disabled = false;
    fetchTodos();
    document.getElementById('loginUsername').value = "";  // Limpiar campo
    document.getElementById('loginPassword').value = "";  // Limpiar campo

    // Mostrar el nombre de usuario en la interfaz
    document.getElementById('currentUser').textContent = `Sesión iniciada: ${data.username}`;
  })
  .catch(error => {
    console.error('Error al iniciar sesión:', error);
    alert('Error al iniciar sesión: ' + error.message);
  });
});


  

  function fetchTodos() {
    fetch('/api/todos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(response => response.json())
      .then(todos => {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';
        todos.forEach(todo => {
          addTodoToDOM(todo);
        });
      });
  }
  

  document.getElementById('addTodo').addEventListener('click', () => {
    const newTodoText = document.getElementById('newTodo').value;
  
    fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text: newTodoText }),
    })
    .then(response => response.json())
    .then(todo => {
      addTodoToDOM(todo);
      document.getElementById('newTodo').value = "";  // Limpiar campo
    });
  });
  

function addTodoToDOM(todo) {
  const todoList = document.getElementById('todoList');
  const li = document.createElement('li');
  li.textContent = todo.text;
  li.dataset.id = todo.id;

  li.addEventListener('click', () => {
    li.classList.toggle('completed');
    toggleComplete(todo.id, li.classList.contains('completed'));
  });

  li.addEventListener('dblclick', () => {
    deleteTodo(todo.id, li);
  });

  todoList.appendChild(li);
}

function toggleComplete(id, completed) {
  fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text: completed ? 'completed' : '' }),
  });
}

function deleteTodo(id, li) {
  fetch(`/api/todos/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }).then(() => {
    li.remove();
  });
}
