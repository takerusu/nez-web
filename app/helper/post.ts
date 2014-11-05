///<reference path='../../typings/node/node.d.ts'/>
///<reference path='../../typings/express/express.d.ts'/>

var http = require('http');

/**
 * JSONをpostする
 * @method postJSON
 * @param {Object} data POSTするbody
 * @param {Object} option POST先などのヘッダ
 * @param {Function} callback POSTの返答を処理する関数
 * @return {void}
 */
export function postJSON(data, option, callback) {
    if(!option.method) {
        option.method  = 'POST';
    }
    if(!option.headers) {
        option.headers = {'Content-Type': 'application/json'};
    }

    console.log('postJSON');
    console.log(option);
    var request = http.request(option, function(response) {
        var body = '';
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
            body += chunk;
        });

        response.on('end', function() {
            var ret = JSON.parse(body);
            callback(ret);
        });
    });
    request.write(JSON.stringify(data));
    request.write('\n');
    request.end();
}

