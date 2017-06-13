var profile = process.env.NODE_ENV || 'development'
var config = require('./config/config.' + profile + '.js')

var HttpProvider = require('ethjs-provider-http')
var BlockTracker = require('eth-block-tracker')
var moment = require('moment')
var Tinybot = require('tinybot')

var activeP
var doneP
var latest = null

require('throng')({
  start: () => {
    var blockTracker = new BlockTracker({ provider: new HttpProvider('https://mainnet.infura.io') })
    var bot = new Tinybot(config.slack.token)

    blockTracker.on('latest', function (block) {
      var current, diff

      if (!block.number) return console.log('no block number')

      current = parseInt(block.number, 16)
      console.log('current=' + current)
      if ((doneP) || (current <= latest)) return

      latest = current
      if (latest < config.startBlock) {
        diff = config.startBlock - latest
        if ((diff < 10) || ((diff % 10) === 0)) {
          bot.say('_at block ' + latest + ' of ' + config.startBlock + ', ' + diff + ' blocks to go, ' +
                  'estimated time until sale: ' + moment().add(diff * 15, 'seconds_').fromNow(), config.slack.monitor,
                  console.err)
          bot.say('*no token sales until then. no pre-sales, period.*', config.slack.monitor, console.err)
        }
        return
      }

      if (latest >= config.endBlock) {
        if (doneP) return

        doneP = true
        return bot.say('_*the token sale is completed.*_', config.slack.monitor, console.err)
      }

      if (!activeP) {
        activeP = true
        return bot.say('_*the token sale is beginning.*_', config.slack.monitor, console.err)
      }
    })

    require('http').createServer((request, result) => { result.end() }).on('clientError', (err, socket) => {
      if (err) console.log(err)
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
    }).listen(config.portno)
    console.log('listening on ' + config.portno)
    config.address = config.address.toLowerCase()

    bot.start((err, result) => {
      if (err) return console.log(err)

      console.log('monitoring ' + config.slack.monitor)
      bot.say('_reporting for duty._', config.slack.monitor, console.err)
      blockTracker.start()

      bot.hears({
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
        bot.say(':warning: ' + warning, config.slack.monitor, console.err)
      })
    })
  },

  workers: 1,
  lifetime: Infinity
})
