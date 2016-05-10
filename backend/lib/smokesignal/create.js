var _ = require('lodash')
var debug = require('debug')('register')
var error = debug
error.log = console.log.bind(console)
//var socket = require('socket.io')(require('../../config.js').socket.port);
var es = require('../es')
const WOODS_FOR_SS = 10

module.exports = function (params, socket, io) {

	//fetching user information
    es.get({
      index: 'users',
      type: 'user',
      id: params.userId
    })
		.catch(function(err) {
			
			error('woodAndKarma/onSmokeSignalCreation', err, params)
			if (err.status == 404) {
				
				error('woodAndKarma/onSmokeSignalCreation: user not found', params.userId)
			}
			throw err
		})
		.then(function(user) {
			if (user._source.woods < WOODS_FOR_SS) {
				
				socket.emit('c-smokesignal.error', 'Insufficient wood ' + user._source.woods)
			
			} else {
				
				return createSmokeSignal(params, socket, io)
				.then(function(res) {
				return updateWoods(params, user, io)    
				})
				.then(function() {
					
					socket.emit('c-smokesignal.done', RESULT)
				})
			}
		})
			
}
	
	
	function createSmokeSignal (params, socket, io) {
  debug('error')
  es.index({
      index: 'smokesignals',
      type: 'smokesignal',
      id: params._id,
      body: _.pick(params, ['userId', 'title', 'category',
        'message', 'img', 'createdAt', 'burningTill',
        'active', 'thanks', 'nothanks', 'anonymous', 'comments'
      ])
    })
    .then(function(res) {
      es.search({
        index: 'users',
        type: 'user',
        body: {
          query: {
              bool: {
                  should: [
                      {match: { interests : params.message }}
                  ]
              }
          }
       }
    }).then(function(res) {

      if(!_.isEmpty(res.hits.hits)) {

        res.hits.hits.forEach(function(user) {
          io.to(user._id).emit('interestsSmokeSignal', {
            result: {
              _source: params,
              _id: params._id
            }
          }) 
        }) 

      }

      }).catch(function(err) {
        
        error('Error in Getting Users', err )

      })
      io.emit('c-smokesignal.done', {
        result: {
          _source : params,
          _id: params._id
        }
      })
      socket.emit('c-smokesignal.result', {
        message: 'Smokesignal Created',
        code: 201,
      })
      console.log(io.sockets.sockets)     
      io.sockets.sockets.forEach(function(socket) {
        socket.join(params._id)  
      })

    })
    .catch(function(err) {
      error('Error in indexing user', err)
        // c-smokesignal.error: {message: 'Error in creating user in database', code: 500, err: err}
      socket.emit('c-smokesignal.error', {
        message: 'Error in creating smokesignal in database',
        code: 500,
        err: err
      })

      throw err

    })
    .done()
}

function updateWoods(params, user, io) {
	
	var smokeCreator = user._source

	//updating smokeCreator's wood
	smokeCreator.woods -= WOODS_FOR_SS
	//updating database
	return es.update({
		index: 'users',
		type: 'user',
		id: params.userId,
		body: {
				doc: _.pick(smokeCreator, ['woods'])
		}
	})
	.then(function(res) {
		io.to(smokeCreator.nick).emit('wood', {
			message: 'Deducted ' + WOODS_FOR_SS + ' woods. Your Wood = ' + smokeCreator.woods,
			code: '201',
			result: {
				user: smokeCreator
			}
		})

	})
	.catch(function(err) {
		error('Error in updating wood for user', userId, err)
		io.to(smokeCreator.nick).emit('wood' + '.error', {
			message: 'Error in processing your ' + params.action,
			code: '201'
		})
	})
}


if (require.main === module) {
	var io = require('socket.io-client')

	var socket = io('http://localhost:3000', {jsonp: false, reconnection: true})
	socket.on('connect', function(){
		socket.emit('c-smokesignal.done', {
			_id: '1',
			userId: 'awesomepankaj',
			title: 'Wild vs Man',
			type: 'Need',
			category: 'Dharma',
			message: 'Demo MSG',
			description: 'kuch bhi',
			img: 'http://res.cloudnary.com/image.png',
			tags: ['wild', 'man', 'hb'],
			createdAt: '04.15',
			burningTill: '04.15',
			active: true,
			thanks: 0,
			nothanks: 0,
			anonymous: false,
			comments: []
		})
	})
}
