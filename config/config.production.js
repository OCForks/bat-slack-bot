module.exports =
{ address    : process.env.CONTRACT_ADDRESS
, startBlock : process.env.CONTRACT_START_BLOCK
, endBlock   : process.env.CONTRACT_END_BLOCK
, portno     : process.env.PORT
, slack      :
  { monitor  : process.env.SLACK_MONITOR_CHANNEL
  , report   : process.env.SLACK_REPORT_CHANNEL
  , token    : process.env.SLACK_TOKEN
  , token2   : process.env.SLACK_ADMIN_TOKEN
  , user     : process.env.SLACK_USER
  }
, restricted :
  { email    : process.env.RESTRICTED_EMAIL
  , name     : process.env.RESTRICTED_NAME
  }
  , website  : process.env.WEBSITE
}
