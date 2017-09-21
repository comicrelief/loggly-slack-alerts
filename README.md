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

    sls deploy -v