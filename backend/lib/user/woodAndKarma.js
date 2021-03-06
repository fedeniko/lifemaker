var _ = require('lodash')
var debug = require('debug')('user/woodAndKarma')
var error = debug
error.log = console.error.bind(console)

var es = require('../es')


module.exports = function(params, socket, io) {

  return es.mget({
    index: 'users',
    type: 'user',
    body: {
      ids: [params.thankerId, params.thankeeId]
    }

  }).catch(function(err) {
    error('Error in getting users from DB', params)

  }).then(function(res) {

    if (!res) {
      return
    }
    debug(params)
    var thanker = res.docs[0]._source
    var thankee = res.docs[1]._source

    if (!thanker) {
      error('thanker not found', params.thankerId)
      return
      //throw new Error('Not found Thanker ' + params.thankerId)
    }
    if (!thankee) {
      error('thankee not found', params.thankeeId)
      return
      //throw new Error('Not found Thankee ' + params.thankeeId)
    }

    //Update Thankee
    if (params.action === 'thanks') {
      thankee.woods += params.count
      thankee.karma += params.count * 5
    } else {
      thankee.karma -= params.count * 5
    }

    thankee[params.action + 'Received'].count += params.count

    var thankeesThankers = thankee[params.action + 'Received'].givers
    if (!_.find(thankeesThankers, params.thankerId)) {
      thankeesThankers.push(params.thankerId)
    }

    //Update thanker
    thanker.woods -= params.count
    thanker.karma += params.count
    thanker[params.action + 'Given'].count += params.count

    var thankersThankees = thanker[params.action + 'Given'].receivers
    if (!_.find(thankersThankees, params.thankeeId)) {
      thankersThankees.push(params.thankeeId)
    }
    debug(thanker, thankee, 'user Objects')
    var userObjects = [thanker, thankee]

    userObjects.forEach(function(user) {

      es.update({
        index: 'users',
        type: 'user',
        id: user.nick,
        body: {
          doc: user
        }
      }).then(function(res) {

        debug(res, "Now Getting Both the userObjects")
        io.to(user.nick).emit('woodKarma', {
          message: 'Thanks! Your Karma = ' + user.karma + ' Wood = ' + user.woods,
          code: '201',
          result: {
            user: user
          }
        })
      }).catch(function(err) {

        error('Error in updating woodsAndKarma', err)
        io.to(user.nick).emit('woodKarma' + '.error', {
          message: 'Error in processing your ' + params.action,
          code: '201'
        })
      })
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
