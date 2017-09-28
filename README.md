# loggly-slack-alerts

## Purpose

Listen for alerts from Loggly and publish to Slack.

Loggly includes an integration with Slack to do this directly, however this integration has several deficiencies:
* It includes "@channel" which forces all users to be alerted (unless they mute the channel)
* All data for all log entries matching the alert are dumped into the alert message - in the case of JSON data it would be better to summarise only the key attributes of the log entry (i.e. message, etc)
* Log entries matching the alert are repeated in later alerts

This simple script attempts to format the Slack messages in a friendlier way. Key information is extracted from log messages and an attempt is made to skip repeated messages.

The JSON log entries sent by Loggly are sent escaped inside a JSON container. Once extracted, the log entries are rarely well-formed JSON. Most of the complexity in this script are attempts to remove invalid objects/strings in the JSON before attempting to parse is.


## Requirements

* Serverless (https://serverless.com/framework/docs/getting-started/)
* NodeJS 6.5+ & NPM 
* AWS key


## Installation

    npm install
    cp env.yaml.sample env.yaml
    ## replace env.yaml keys with valid values


## Local Testing

    ## populate test-data-json.txt with data from loggly endpoint
    sls invoke local -f alert -p test-data-json.txt


## Deploy

### Setup AWS keys

    ## obtain aws access key pair
    export AWS_ACCESS_KEY_ID=<your-key-here>
    export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>

### Dev stage (used in #frost-logs-testing)

    ## perform serverless deploy
    sls deploy -s dev

### Prod stage (used in #frost-loggly)

    ## perform serverless deploy
    sls deploy -s prod


## Loggly Setup

Setup a new Loggly Alert Endpoint at the following URL:
https://<your-loggly-host>.loggly.com/alerts/endpoint

The endpoint type should be HTTP/S, the URL should be set to this serverless endpoint and the HTTP Method should be set to "POST".

Assign this Alert Endpoint to one or more Loggly alerts. Once an alert is triggered, a message should be sent to Slack via this serverless endpoint.
