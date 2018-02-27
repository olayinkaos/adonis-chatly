// ./app/Services/ChatkitService.js
const Helpers = use('Helpers')
const Env = use('Env')
const Chatkit = require('pusher-chatkit-server')

/**
 * Initialize the chatkit service using the instanceLocator 
 * and secret key gotten from the chatkit dashboard
 */
const chatkit = new Chatkit.default({
  instanceLocator: Env.get('CHATKIT_INSTANCE_LOCATOR'),
  key: Env.get('CHATKIT_KEY')
})
/**
 * Chatkit Service Class
 */
class ChatkitService {
  /**
   * Register a new user
   * @param {String|Int} id - User unique ID
   * @param {String} name - User's Screen name
   * @param {String} avatar - Url to user's profile picture
   */
  async registerUser (id, name, avatar = null) {
    return await chatkit.createUser(String(id), name, avatar)
  }

  /**
   * Authenticate the user via Chatkit to get a JWT token
   * @param {Object} request - Request object sent from the Frontend
   * @param {String|Int} id - User unique ID 
   */
  async authenticateUser (request, id) {
    return await chatkit.authenticate(request, String(id))
  }
}
module.exports = new ChatkitService()
