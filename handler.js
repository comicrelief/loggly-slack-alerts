'use strict';

module.exports.alert = (event, context, callback) => {

  const body = event.body
  const data = JSON.parse(body)

  //console.log(JSON.stringify(data))

  const message = "*" + data.alert_name + "* <" + data.search_link + "|More details>" +
    " " + "(From:" + data.start_time + " To:" + data.end_time + ")"

  const attachments = [];

  // Loggly pushes JSON which is escaped in a way JSON.parse() cannot handle
  // Remove "known problems" with regex before continuing
  const knownProblemVcapApplication = /"VCAP_APPLICATION":"{.*}",/
  const knownProblemCfInstancePorts = /"CF_INSTANCE_PORTS":"\[.*\]",/
  const knownProblemEarlyEndOfFile = /\",[^,*]*\.\.\.$/

  for (const i in data.recent_hits) {

    if (i >= 20) {
      // limit to first 20 logs
      break
    }

    var log = data.recent_hits[i]
    log = log.replace(knownProblemVcapApplication, '');
    log = log.replace(knownProblemCfInstancePorts, '');
    log = log.replace(knownProblemEarlyEndOfFile, '"}}');
    
    var logData = null
    try {
      logData = JSON.parse(log)      
    } catch (err) {
    }

    if (logData) {

      var logText = logData.message
      var logChannel = logData.channel
      var logEnv = logData.context.env ? logData.context.env : logData.context.APPLICATION_ENV
      var logLevel = logData.level_name
      var logColour = '#000000'
      if ('ERROR' === logLevel || 'CRITICAL' === logLevel) {
        logColour = 'danger'
      } else if ('WARNING' === logLevel || 'NOTICE' === logLevel) {
        logColour = 'warning'
      }

      attachments.push({
          "text": logText,
          "title": logChannel,
          "footer": logEnv,
          "color": logColour
      })

    } else {

      attachments.push({
          "text": log
      })

    }

  }

  slackMessage(message, attachments)
  
  const response = {
    statusCode: 200,
    body: 'OK',
  };

  callback(null, response);

};

function slackMessage(message, attachments) {

  const WebClient = require('@slack/client').WebClient;

  const token = process.env.SLACK_TOKEN;
  const channel = process.env.SLACK_CHANNEL
  const username = process.env.SLACK_USERNAME

  const attachmentsJson = JSON.stringify(attachments)

  const web = new WebClient(token)
  web.chat.postMessage(channel, message, {
    'username': username,
    'attachments': attachmentsJson
  })

}
