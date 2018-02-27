// ./app/Controllers/Http/AuthController
'use strict'
const ChatkitService = use('App/Services/ChatkitService')
const User = use('App/Models/User')
/**
 * AuthController
 */
class AuthController {
  /**
   * Show login view
   * @param {*}  
   */
  async showLogin({ view }) {
    return view.render('login')
  }
  /**
   * Show Register view
   * @param {*}  
   */
  async showRegister({ view }) {
    return view.render('register')
  }
  /**
   * POST - Login
   * @param {*}  
   */
  async login({request, auth, response, session}) {
    const {email, password} = request.all()
    try {
      await auth.remember(true).attempt(email, password)      
    } catch (error) {
      console.log(error);
      session.flash({ error: 'Unable to Login!'})
      return response.redirect('back') 
    }
    response.redirect('/')
  }
  /**
   * POST - Register
   * @param {*} 
   */
  async register({ request, auth, response, session }) {
    // Create User in the Database
    let user;
    try {
      // Pick out the username, email and password from the request object
      user = await User.create(request.only(['username', 'email', 'password']))     
    } catch (error) {
      console.log(error);
      session.flash({ error: 'Unable to register!'})
      return response.redirect('back')  
    }
    // Register on chatkit
    try {
      // Generate Random User Picture using randomuser.me api
      let gender = ['men', 'women']
      let random_number = Math.floor(Math.random() * 100);
      let random_gender = gender[Math.floor(Math.random()*gender.length)];
      let avatarUrl = `https://randomuser.me/api/portraits/${random_gender}/${random_number}.jpg`
      let resp = await ChatkitService.registerUser(user.id, user.username, avatarUrl)            
    } catch (error) {
      session.flash({ error: 'Unable to register on Chatkit.'})
      return response.redirect('back')      
    }
    // Attempt Login 
    try {
      const {email, password} = request.all()
      await auth.remember(true).attempt(email, password)      
    } catch (error) {
      session.flash({ error: 'Unable to Login!'})
      return response.redirect('back') 
    }
    response.redirect('/')
  }
  /**
   * POST - Logout user
   * @param {*} 
   */
  async logout({ auth, response }) {
    try {
      await auth.logout()
      response.redirect('/login')
    } catch (error) {
      response.redirect('/')
    }    
  }
  /**
   * POST - get user token
   * @param {*}  
   */
  async token({ request, response, auth }){
    let data = request.all()
    
    const user = await auth.getUser()
    const token = await ChatkitService.authenticateUser(data, user.id)
    
    response.json(token)
  }
}
module.exports = AuthController