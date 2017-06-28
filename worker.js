process.env.NEW_RELIC_NO_CONFIG_FILE = true
if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) { var newrelic = require('newrelic') }
if (!newrelic) {
  newrelic = {
    createBackgroundTransaction: (name, group, cb) => { return (cb || group) },
    noticeError: (ex, params) => {},
    recordCustomEvent: (eventType, attributes) => {},
    endTransaction: () => {}
  }
}

var profile = process.env.NODE_ENV || 'development'
var config = require('./config/config.' + profile + '.js')

var HttpProvider = require('ethjs-provider-http')
var BlockTracker = require('eth-block-tracker')
var moment = require('moment')
var path = require('path')
var Slackbot = require('slackbots')
var Tinybot = require('tinybot')
var underscore = require('underscore')

if (((!config.slack.report) || (!config.restricted)) && (!config.address)) {
  console.log('nothing to do!?!')
  process.exit(0)
}

var latest = null

require('throng')({
  start: (id) => {
    var adminbot, chatbot

    require('http').createServer((request, result) => { result.end() }).on('clientError', (err, socket) => {
      if (err) console.log(err)
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
    }).listen(config.portno)
    console.log('listening on ' + config.portno)

    if ((config.slack.report) && (config.restricted)) {
      adminbot = new Tinybot(config.slack.token2 || config.slack.token)
      adminbot.start((err, result) => {
        if (err) return console.log(err)

        var userbot = new Slackbot({ token: config.slack.token })
        userbot.on('start', () => {
          const emailExp = config.restricted.email && new RegExp(config.restricted.email)
          const nameExp = config.restricted.name && new RegExp(config.restricted.name)
          const npminfo = require(path.join(__dirname, 'package'))

          var reports = {}

          const check = () => {
            var admins = []
            var bots = []

            userbot.getUsers().then((result) => {
              var members = result && result.members

              if (!members) return adminbot.say(':warning: no members?!?', config.slack.report, console.err)

              var info = (member) => {
                return JSON.stringify(underscore.extend(
                underscore.pick(member, [ 'name', 'real_name' ]),
                underscore.pick(member.profile, [ 'first_name', 'last_name', 'title', 'phone', 'skype', 'email' ])))
              }

              members.forEach((member) => {
                if (reports[member.id]) return

                reports[member.id] = member
                if (member.deleted) return

                if (member.is_admin) return admins.push(member)

                if (member.is_bot) return bots.push(member)

                if (((nameExp) && (nameExp.test(member.name))) || ((emailExp) && (emailExp.test(member.profile.email)))) {
                  adminbot.say(':warning: suspicious member ' + info(member), config.slack.report, console.err)
                }
              })

              admins.forEach((admin) => {
                adminbot.say('admin ' + info(admin), config.slack.report, console.err)
              })
              bots.forEach((bot) => {
                adminbot.say('  bot ' + info(bot), config.slack.report, console.err)
              })
            }).catch(console.error)

            setTimeout(check, 5 * 60 * 1000)
          }

          console.log('reporting ' + config.slack.report)
          console.log('matching emailExp=' + emailExp.toString() + ' and/or nameExp=' + nameExp.toString())
          adminbot.say('_reporting for duty._', config.slack.report, console.err)

          adminbot.say(require('os').hostname() + ' ' + npminfo.name + '@' + npminfo.version +
                       ' started ' + (process.env.DYNO || 'web') + '/' + id, '#devops-bot', console.err)

          check()
        })
      })
    }

    config.address = config.address && config.address.toLowerCase()
    if (!config.address) return

    chatbot = new Tinybot(config.slack.token)
    chatbot.start((err, result) => {
      var activeP, blockTracker, doneP

      if (err) return console.log(err)

      blockTracker = new BlockTracker({ provider: new HttpProvider('https://mainnet.infura.io') })
      blockTracker.on('latest', function (block) {
        var current, diff

        if (!block.number) return console.log('no block number')

        current = parseInt(block.number, 16)
        console.log('current=' + current + ' latest=' + latest)
        if (!latest) doneP = current > config.endBlock
        if ((doneP) || (current <= latest)) return

        if ((!latest) && (current > config.endBlock)) return

        latest = current
        if (latest < config.startBlock) {
          diff = config.startBlock - latest
          if ((diff < 10) || ((diff % 10) === 0)) {
            chatbot.say('_at block ' + latest + ' of ' + config.startBlock + ', ' + diff + ' blocks to go, ' +
                        'estimated time until sale: ' + moment().add(diff * 15, 'seconds_').fromNow(), config.slack.monitor,
                        console.err)
            chatbot.say('*no token sales until then. no pre-sales, period.*', config.slack.monitor, console.err)
          }
          return
        }

        if (latest >= config.endBlock) {
          if (doneP) return

          doneP = true
          return chatbot.say('_*the token sale is completed.*_', config.slack.monitor, console.err)
        }

        if (!activeP) {
          activeP = true
          return chatbot.say('_*the token sale is beginning.*_', config.slack.monitor, console.err)
        }
      })

      chatbot.hears({
        channel: config.slack.monitor,
        text: /(0x)?[0-9a-fA-F]{40}/
      }, (message, matches) => {
        var warning
        var address = matches[0].toLowerCase()
        var warning1 = `*${matches[0]} is not a valid address for purchasing tokens -- consult ${config.website} for the official address.*`
        var warning2 = `*The token sale has not yet begun -- please do not send ETH to that address.*`
        var warning3 = `*The token sale is over! -- please do not send ETH to that address.*`

        if ((config.slack.user) && (message.user === config.slack.user)) return

        if (address !== config.address) warning = warning1
        else if (latest < config.startBlock) warning = warning2
        else if (latest > config.endBlock) warning = warning3
        else return

        console.log(JSON.stringify(message, null, 2))
        chatbot.say(':warning: ' + warning, config.slack.monitor, console.err)
      })

      console.log('monitoring ' + config.slack.monitor)
      console.log('matching address=' + config.address)
      chatbot.say('_reporting for duty._', config.slack.monitor, console.err)

      blockTracker.start()
    })
  },

  workers: 1,
  lifetime: Infinity
})
