var React = require('react-native')

window.navigator.userAgent = 'react-native'

var Reflux = require('reflux')
var moment = require('moment')
var Icon = require('react-native-vector-icons/Ionicons');
var {
  Text,
  View,
  DrawerLayoutAndroid,
  TouchableOpacity,
  ListView,
  ScrollView,
  Image,
  ToolbarAndroid,
  Dimensions,
  TextInput,
  ToastAndroid,
} = React

var SmokeStore = require('../Stores/SmokeStore')
var socket = require('../socket')
var styles = require('../styles/styles.js')
var ApplicationHeader = require('./ApplicationHeader')
var CreateSmokeSignal = require('./SmokeSignals/Create/Button')
var SideBar = require('./SideBar')
var UserStore = require('../Stores/UserStore')
var SmokeSignalBox = require('./SmokeSignalBox')
var BuddhaSection = require('./BuddhaSection')

var ScreenHeight = Dimensions.get('window').height
var ds= new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

var ThreadPage = React.createClass({

  mixins: [
    Reflux.ListenerMixin
  ],

  getInitialState: function() {

    return {
      showCommentBox: false,
      text: '',
      smokeSignal: SmokeStore.getSmokeSignal(this.props.id),
      comment: '',
      message: '',
      more: false,
    }

  },

  componentDidMount: function() {

    this.listenTo(SmokeStore, this.refreshList)

    if (this.props.openCommentBox) {
      this.setState({showCommentBox: true})
    }

    if(this.state.smokeSignal._source.message.length > 200) {

      this.setState({
        message : this.state.smokeSignal._source.message.slice(0, 200) + '...',
        more: true
      })

    }

  },

  showMore: function() {
    this.setState({
      more: false,
      message: this.state.smokeSignal._source.message
    })
  },

  refreshList: function(message) {
    if(message) {
      ToastAndroid.show(message.message, ToastAndroid.SHORT)
    }
    
    this.setState({smokeSignal: SmokeStore.getSmokeSignal(this.props.id)})
  },

  _handleSubmit: function() {
    this.props.navigator.push({id : 3 ,})
  },

  handleProfilePage: function(userId) {
    if(userId === UserStore.getUserData().nick) {
      this.props.navigator.push({id : 4})
    }
    else {
      this.props.navigator.push({id : 9, userId: userId})
    }
  },

  onActionSelected: function(position) {
    if (position === 0) { // index of 'Settings'
      showSettings();
    }
  },

  ssAction: function(ss) {
    socket.emit('u-smokesignal.thanks', {thankerId: UserStore.getUserData().nick, thankeeId: ss.userId, _id: this.state.smokeSignal._id, action: ss.action, count: 1})
  },

  addCommentAction: function(comment, e) {
    var commentThanks = {
      thankerId: UserStore.getUserData().nick,
      thankeeId: comment.userId,
      _id: this.state.smokeSignal._id,
      commentId: comment.commentId,
      action: comment.action,
      count: 1
    }
    socket.emit('u-smokesignal.comment.thanks', commentThanks)
  },

  openDrawer: function(){
    this.refs['DRAWER'].openDrawer()
  },

  showCommentBox: function() {
    if(!this.state.showCommentBox) {
      this.setState({showCommentBox: true})
      this.refs.comment.focus()
    }
    else {
      this.setState({showCommentBox: false})
    }
  },

  submitComment: function() {

    this.refs.comment.blur()
    this.setState({
      showCommentBox: false
    })
    var comment = {
      _id: this.state.smokeSignal._id,
      commentId: +moment() + '_' + Math.random(),
      text: this.state.comment,
      thanks: 0,
      nothanks: 0,
      userId: UserStore.getUserData().nick
    }

    this.setState({comment: ''})
    socket.emit('u-smokesignal.comment', comment)
  },

  submitCommentText: function(comment) {
    this.setState({comment: comment})
  },

  render: function() {


    return (
      <DrawerLayoutAndroid
          drawerWidth={300}
          ref={'DRAWER'}
          drawerPosition={DrawerLayoutAndroid.positions.Left}
          renderNavigationView={() => <SideBar navigator={this.props.navigator}/>}>
          <ApplicationHeader openDrawer={this.openDrawer} title= 'SmokeSignal'/>
          <ScrollView
            automaticallyAdjustContentInsets={false}
            style = {styles.scrollView}
          >
          <View style={styles.container}>
              <SmokeSignalBox ssType= {this.state.smokeSignal._source.ssType} category={this.state.smokeSignal._source.category} message={this.state.smokeSignal._source.message}/>

              { this.state.more && <TouchableOpacity style={styles.showMoreButton} onPress={this.showMore}>
                <Text style={styles.showMore}>show more.</Text>
              </TouchableOpacity> }

              <TouchableOpacity style={styles.author} onPress={this.handleProfilePage.bind(this, this.state.smokeSignal._source.userId)}>
                <Text style={styles.author}>written by {this.state.smokeSignal._source.userId}</Text>
              </TouchableOpacity>
              <BuddhaSection item={this.state.smokeSignal} itemType='smokesignal' onPress={this.ssAction}  />
            <View style={styles.commentStyle}>
            { this.state.smokeSignal._source.comments.length === 1 &&
              <Text style={styles.comments}>{this.state.smokeSignal._source.comments.length} Comment</Text> ||
              <Text style={styles.comments}>{this.state.smokeSignal._source.comments.length} Comments</Text>
            }

              <TouchableOpacity style={styles.commentButton} onPress={this.showCommentBox}>
                <Text style={styles.commentText}>Comment</Text>
              </TouchableOpacity>
            </View>
            {this.state.smokeSignal._source.comments.map(this.renderCommentBox)}
            {this.state.showCommentBox &&
            <View style={styles.commentInputView}>
            <TextInput
              ref= 'comment'
              style={{height: 40, borderColor: 'gray', borderWidth: 1, width: 280}}
              onChangeText={this.submitCommentText}
              autoFocus= {true}
              value={this.state.comment}
              onSubmitEditing={this.submitComment}
            />
            </View>
          }
          </View>
        </ScrollView>
        { !this.state.showCommentBox && <CreateSmokeSignal navigator={this.props.navigator}/>}
      </DrawerLayoutAndroid>
    );
  },
   renderCommentBox: function(comment, i) {
     var that = this
    return (
      <View style={styles.comment} key={i}>
        <View style={styles.parentContainer}>
          <TouchableOpacity onPress={this.handleProfilePage.bind(this, comment.userId)}>
            <Text>{comment.userId}</Text>
          </TouchableOpacity>
          <View style={styles.commentContainer}>
            <Text style={styles.description}>{comment.text}</Text>
          </View>
        </View>

        <BuddhaSection item={comment} itemType='comment' onPress={that.addCommentAction}  />

      </View>
    )
  },

});

module.exports = ThreadPage
