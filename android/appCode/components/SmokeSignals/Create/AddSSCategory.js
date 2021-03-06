var React = require('react-native')

window.navigator.userAgent = 'react-native'

var Icon = require('react-native-vector-icons/Ionicons')
var moment = require('moment')

var {
  View,
  TouchableOpacity,
  Text,
  DrawerLayoutAndroid,
  ToolbarAndroid,
  Dimensions,
  ToastAndroid,
  TouchableHighlight
} = React


var smokeSignalCategories = require('../../../config').smokeSignalCategories

var SmokeStore = require('../../../Stores/SmokeStore')
var socket = require('../../../socket')
var UserStore = require('../../../Stores/UserStore')
var SideBar = require('../../SideBar')
var styles = require('../../../styles/styles')
var ScreenHeight = Dimensions.get('window').height
var Utility = require('../../../utility')

var AddSSCategory = React.createClass({

  getInitialState: function() {
    return {
      selectedValue: 0
    }
  },

  componentDidMount: function() {
    socket.on('c-smokesignal.result', function(result) {
      ToastAndroid.show(result.message, ToastAndroid.SHORT)
      this.props.navigator.push({id : 1})
    }.bind(this))
  },

  getCategory: function(index) {
    return smokeSignalCategories[index];
  },

  _onPressButton: function(val) {
    this.setState({
      selectedValue: val
    })
  },

  _handleSubmit: function() {
    var smokeSignal = {
      userId: UserStore.getUserData().nick,
      _id: +moment() + '_'+ Math.random(),
      message: this.props.message,
      ssType: this.props.ssType,
      createdAt: +moment(),
      category: this.getCategory(this.state.selectedValue).id,
      burningTill: +(moment().add(this.state.selectedValue, 'days')),
      active: true,
      thanks: 0,
      nothanks: 0,
      comments: [],
      anonymous: false,
    }
    SmokeStore.addSmokeSignal(smokeSignal)
  },

  closeAddSSCategoryPage: function() {

    this.props.navigator.pop()

  },
  render: function() {
    return (
      <DrawerLayoutAndroid
        drawerWidth={300}
        ref={'DRAWER'}
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        renderNavigationView={() => <SideBar navigator={this.props.navigator}/>}
      >
        <ToolbarAndroid style={{backgroundColor: '#ffffff', height: 56}}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.closeButton} onPress={this.closeAddSSCategoryPage}>
              <Icon
                name='arrow-left-c'
                size={20}
                color='#26a69a'
                style={{width:20,height:20,marginLeft:5}}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.createButton}  onPress={this._handleSubmit}>
              <Text style={{color: '#26a69a'}}>CREATE</Text>
            </TouchableOpacity>
          </View>
        </ToolbarAndroid>

        <View style={styles.ssTypeContainer}>
          { smokeSignalCategories.map( (ssCategory, index) => {
            return (
              <TouchableHighlight key={ssCategory.id} onPress={ () => this._onPressButton(index) }>
                <View style={[styles.ssType, {backgroundColor: ssCategory.color}, index === this.state.selectedValue && styles.highlight] }>
                  <Text style={styles.ssCategoryHeader}>
                    {Utility.capitalise(ssCategory.code)}
                  </Text>
                  <View>
                    <Text style={styles.ssCategoryText}>{ssCategory.description}</Text>
                  </View>
                </View>
              </TouchableHighlight>
            )
          })}
        </View>
      </DrawerLayoutAndroid>
    )
  }
})

module.exports = AddSSCategory
