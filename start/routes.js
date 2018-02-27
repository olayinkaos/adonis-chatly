// ./start/routes.js
'use strict'

const Route = use('Route')
// Auth
// Login
Route.get('login', 'AuthController.showLogin')
Route.post('login', 'AuthController.login')
// Register
Route.get('register', 'AuthController.showRegister')
Route.post('register', 'AuthController.register')

// Main
Route.group(() => {
  Route.get('/', async ({ view }) => {   
    // Render the chat.edge file
    return view.render('chat')
  })
  // Chatkit Authorization token
  Route.post('token', 'AuthController.token')
  // Logout
  Route.post('logout', 'AuthController.logout')
}).middleware(['auth'])