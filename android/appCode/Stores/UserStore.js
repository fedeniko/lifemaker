var Reflux = require('reflux')

window.navigator.userAgent = 'react-native'; //or any other string value
var UserActions = require('../Actions/UserActions')
var _ = require('lodash')
var socket = require('../socket')

var UserStore = Reflux.createStore({

  data: {},

  init: function() {
    socket.on('woodKarma', function(data) {
      _.merge(this.data , data.result.user)

      this.trigger()
    }.bind(this))
  },

  getInitialState: function() {
    return this.data
  },
  //Store userData in Store
  storeUserData : function(userData) {
    this.data = userData

    socket.on('u-user.done', function(data) {
      _.merge(this.data , data.result.user)

      this.trigger()
    }.bind(this))
    this.trigger()
  },

  //get User data from store
  getUserData: function() {
    return this.data
  },

  updateInterests: function(interests) {
    this.data.interests = interests
    this.trigger()
  },

  updateInfo: function(userData) {
    _.merge(this.data , userData)
    this.trigger()

  },

  getOtherUserProfile: function(userId) {

      socket.emit('r-user', {nick: userId})

  },

})

module.exports = UserStore
