'use strict';

module.exports.alert = (event, context, callback) => {

  const body = event.body
  const data = JSON.parse(body)

  console.log(JSON.stringify(data))
  
  const response = {
    statusCode: 200,
    body: 'OK',
  };

  callback(null, response);

};
