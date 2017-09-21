# loggly-slack-alerts

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

    ## obtain aws access key pair
    export AWS_ACCESS_KEY_ID=<your-key-here>
    export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
    sls deploy -v

## Loggly Setup

Setup a new Loggly Alert Endpoint at the following URL:
https://<your-loggly-host>.loggly.com/alerts/endpoint

The endpoint type should be HTTP/S, the URL should be set to this serverless endpoint and the HTTP Method should be set to "POST".

Assign this Alert Endpoint to one or more Loggly alerts. Once an alert is triggered, a message should be sent to Slack via this serverless endpoint.
