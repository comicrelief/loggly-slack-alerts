'use strict';

module.exports.alert = (event, context, callback) => {

  const body = event.body
  const data = JSON.parse(body)

  //console.log(JSON.stringify(data))

  const message = "*" + data.alert_name + "* <" + data.search_link + "|More details>" +
    " " + "(From:" + data.start_time + " To:" + data.end_time + ")"

  const attachments = [];
  for (const i in data.recent_hits) {

    const log = data.recent_hits[i]
    
    try {
      const logData = JSON.parse(log)      
    } catch (e) { }

    if (typeof logData !== 'undefined') {
      attachments.push({
          "text": logData.message
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
