'use strict'

module.exports.alert = (event, context, callback) => {

  // Set "debug" mode
  const debug = true

  // Handle event body and parse data
  const body = event.body
  const data = JSON.parse(body)

  if (debug) {
    console.log('Incoming event body...', body)
  }

  // Construct Slack header message
  // (per-log "attachment" messages come later)
  const headerMessage = '*' + data.alert_name + '* <' + data.search_link + '|More details>' +
    ' ' + '(From:' + data.start_time + ' To:' + data.end_time + ')'

  // Ready Slack "attachments" for per-log data
  const attachments = []

  // Loggly pushes JSON which is escaped in a way JSON.parse() cannot handle
  // Remove "known problems" with regex before continuing
  const knownProblemVcapApplication = /"VCAP_APPLICATION":"{.*}",/
  const knownProblemCfInstancePorts = /"CF_INSTANCE_PORTS":"\[.*\]",/
  const knownProblemFeatures = /"FEATURES":"{.*}",/
  const knownProblemExceptions = /"exception_trace":[\s\S]*","exception/
  const knownProblemExceptionsReplacement = '"exception'
  const knownProblemEarlyEndOfFile = /\",[^,*]*\.\.\.$/

  // Regex fallback for plain text logs
  const plainTextError = /[^\.,^ ]*\.([^\.,^ ]*)\.([^\.,^ ]*).*: Got error '(.*)%%%%'%%%%$/
  const plainTextNewlineReplace = '%%%%'
  const plainTextNewlineReplaceRegex = /%%%%/g

  // Limit for number of logs to display in message
  const logLimit = 20

  // Loop through "recent_hits" (i.e. recent Loggly logs matching the alert criteria)
  // For each "recent_hits" item, we'll process the data and add the info as a Slack "attachment"
  for (const i in data.recent_hits) {

    // Limit to process first X logs only
    if (i >= logLimit) {
      break
    }

    // Maninpulate "recent_hits" item, using regex to replace known problems with Loggly JSON
    var log = data.recent_hits[i]
    log = log.replace(knownProblemVcapApplication, '')
    log = log.replace(knownProblemCfInstancePorts, '')
    log = log.replace(knownProblemFeatures, '')
    log = log.replace(knownProblemExceptions, knownProblemExceptionsReplacement)
    log = log.replace(knownProblemEarlyEndOfFile, '"}}')
    
    // Attempt to parse JSON from "recent_hits" item
    // Note: Some recent_hits are JSON formatted, while others are plain text
    // We handle both types here (if logData is set, we're in JSON mode)
    var logData = null
    try {
      logData = JSON.parse(log)      
    } catch (err) {
    }

    // Handle JSON log
    if (logData) {

      // Populate each attachment with Loggly message, channel, env (either "env" or "APPLICATION_ENV") & level_name
      // "env" is specific to the log format used in Comic Relief applications, but everything else is generic to Loggly
      var logText = logData.message
      var logChannel = logData.channel
      var logEnv = logData.context.env ? logData.context.env : logData.context.APPLICATION_ENV
      var logLevel = logData.level_name
      var logColour = '#666666' // grey
      if ('ERROR' === logLevel || 'CRITICAL' === logLevel) {
        logColour = 'danger'
      } else if ('WARNING' === logLevel || 'NOTICE' === logLevel) {
        logColour = 'warning'
      }

      if (debug) {
        console.log('Log event: ' + i, 'JSON formatted log', JSON.stringify({
          'logText': logText,
          'logChannel': logChannel,
          'logEnv': logEnv,
          'logLevel': logLevel
        }))
      }

      attachments.push({
        'text': logText,
        'title': logChannel,
        'footer': logEnv,
        'color': logColour
      })

    // Handle plain-text log (or JSON log that couldn't be parsed properly)
    } else {

      var logCheck = log.replace(/\n/g, plainTextNewlineReplace)

      // Handle plain-text log
      if (plainTextError.test(logCheck)) {

        logCheck = plainTextError.exec(logCheck)

        // Populate each attachment with Loggly log text, service & space
        // The plain-text regex is tailored to the Pivotal/CloudFoundry we're expecting to receive
        var logText = logCheck[3].replace(plainTextNewlineReplaceRegex, '\n')
        var logService = logCheck[2]
        var logSpace = logCheck[1]
        var logColour = '#000000' // black

        if (debug) {
          console.log('Log event: ' + i, 'Plain-text formatted log', JSON.stringify({
            'logText': logText,
            'logService': logService,
            'logSpace': logSpace
          }))
        }

        attachments.push({
          'text': logText,
          'title': logService,
          'footer': logSpace,
          'color': logColour
        })

      // Handle log which couldn't be parsed properly
      // (either invalid JSON that we didn't manage to fix, or a plain-text message not following the usual pattern)
      } else {

        var logNote = 'Could not parse'
        var logColour = '#00ff00' // green

        if (debug) {
          console.log('Log event: ' + i, 'Unparsed log', JSON.stringify({
            'log': log
          }))
        }

        attachments.push({
            'text': log,
            'footer': logNote,
            'color': logColour
        })

      }

    }

  }

  // Send a Slack message containing our header message and per-log attachements
  slackMessage(headerMessage, attachments)
  
  // Always pass back an "OK" response
  const response = {
    statusCode: 200,
    body: 'OK',
  }
  callback(null, response)

}

/*
 * Helper function for sending Slack message
 */
function slackMessage(message, attachments) {

  const WebClient = require('@slack/client').WebClient

  const token = process.env.SLACK_TOKEN
  const channel = process.env.SLACK_CHANNEL
  const username = process.env.SLACK_USERNAME

  if (!token || !channel || !username) {
    console.log('Env variable for "SLACK_TOKEN", "SLACK_CHANNEL" & "SLACK_USERNAME" must be set. Slack message sending skipped!')
  }

  const attachmentsJson = JSON.stringify(attachments)

  const web = new WebClient(token)
  web.chat.postMessage(channel, message, {
    'username': username,
    'attachments': attachmentsJson
  })

}
