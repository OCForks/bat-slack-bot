module.exports =
{ address    : process.env.CONTRACT_ADDRESS
, startBlock : process.env.CONTRACT_START_BLOCK
, endBlock   : process.env.CONTRACT_END_BLOCK
, portno     : process.env.PORT
, slack      :
  { monitor  : process.env.SLACK_MONITOR_CHANNEL
  , token    : process.env.SLACK_TOKEN
  , user     : process.env.SLACK_USER
  }
  , website  : process.env.WEBSITE
}
