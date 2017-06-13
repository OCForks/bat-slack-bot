# bat-slack-bot
Based on Aragon's [slack-bot](https://github.com/aragon/slack-bot).

## Preparation
First,
go to https://.../apps/A0F7YS25R-bots which is where the "Bots" configuration lives.
Click on "Add Configuration" and enter `@bat-bot` for the username.
You will need the use value for the "API Token" for the configuration step,
so copy-paste this.
Then,
fill-in however much information you want and click "Save Integration".




## Configuration
Edit the file `config/config.production.js` when used in production,
otherwise:

        cp config/config.development.js.tpl config/config.development.js

and then edit `config/config.development.js`.

| Environment Variable     | M/O | Semantics                             | Example Value                                |
|--------------------------|:---:|---------------------------------------|----------------------------------------------|
| CONTRACT_ADDRESS         | M   | ETH address of contract               | '0x5cAe9Bc0C527f95CC6558D32EC5B931ad7328088' |
| CONTRACT_START_BLOCK     | M   | Initial block of sale                 | 3842550                                      |
| CONTRACT_END_BLOCK       | M   | Maximum block of sale                 | 3867216                                      |
| PORT                     | M   | port number to listen on              | 3000                                         |
| SLACK_MONITOR_CHANNEL    | M   | Slack chanel to listen on             |'#community'                                  | 
| SLACK_TOKEN              | M   | the "API Token" value                 | 'xoxb-...'                                   |
| SLACK_USER               | O   | the user whose traffic is not scanned | 'admin'                                      |
| WEBSITE                  | M   | where to get more information         | 'https://basicattentiontoken.org'            |

Once you have the `bat-slack-bot` running,
go the monitoring channel configured, and enter:

        @bat-bot

to invite `@bat-bot` to the channel.
The `@slackbot` will respond with:

        You mentioned @bat-bot, but they’re not in this channel. Would you like to
        - invite them to join
        - or have Slackbot send them a link to your message?
        - Or, do nothing.

Please click on the first link and then restart the `bat-slack-bot` and in the monitoring channel,
the `@bat-bot` will reply with:

_reporting for duty_

## Operation
Take a look at `worker.js` and you'll see the many insightful remarks that the `bat-slack-bot` has to opine with.


Enjoy!
