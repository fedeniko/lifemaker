var _ = require('lodash')
var debug = require('debug')('register')
var error = debug
error.log = console.log.bind(console)

var es = require('../es')

/**
 *@param userId the id of user whose interest match is to be done
 *@param size number of smoke signals wanted in response
 *@param from what is the offset wanted in response
 */
module.exports = function(params, socket, io) {

  return es.get({
    index: 'users',
    type: 'user',
    id: params.userId,
    size: params.size,
    from: params.from
  })
  .catch(function(err) {
    error('Error in getting user by id ', params.userId, err)

    socket.emit('r-user.interest-matches.error', {
      status: err.status,
      message: err.status == 404? 'User not found ' + params.userId : 'Error in reading Interests from DB',
      err: err
    })
    throw err
  })
  .then(function(resp) {
    debug(resp)
    var interests = resp._source.interests || []
    debug(interests)
    return es.search({
      index: 'smokesignals',
      type: 'smokesignal',
      body: {
        query: {
          filtered: {
            query: {
                bool: {
                  should: interests.map(function(interest) {
                    return { match_phrase: { message: interest} }
                  }),
                }
            },
            filter: {
              term: {active: true}
            }
          }
        },
        sort: [{
          createdAt: {
            order: "desc"
          }
        }]
      }
    }).then(function(res) {
      socket.emit('r-user.interest-matches.done', {
        message: 'Matched ' + res.hits.total + ' Smoke Signals',
        code: '200',
        results: res.hits.hits,
        counts: res.hits.total
      })
    })
    .catch(function(err) {
      error('Error in interest based search ', interests, err)

      socket.emit('r-user.' + params.userId + '.interest-matches.error', {
        status: err.status,
        message: 'DB Error in getting Smoke Signals',
        err: err
      })
  })
  .catch(debug)

 })
}


if (require.main === module) {
  module.exports({
    search: {
      searchText: 'sexyboy'
    }
  })
}
