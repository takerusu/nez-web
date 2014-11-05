///<reference path='../../typings/node/node.d.ts'/>
///<reference path='../../typings/express/express.d.ts'/>

var express = require('express');
var router = express.Router();
var http = require('../helper/post');
var config = require('config');
var exec = require('exec-sync');
var fs = require('fs');
var tmp = require('tmp');
var path = require('path');

var nez_command = config.nez.env + ' java -jar ' + config.nez.path + ' ' + config.nez.option + ' ';

function genResponse(res, j) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(j));
    res.end('\n');
}

function createFileAndExec(src_tempfile, source, p4d_tempfile, p4d, command, callback) {
    fs.writeFileSync(src_tempfile, source);
    fs.writeFileSync(p4d_tempfile, p4d);
    var out = exec(command, true);
    callback(out.stdout, out.stderr);
}

router.post('/run', function(req, res) {
    //dest server is configured by default.yaml
    var client_body = req.body;
    console.log(client_body);
    tmp.file({prefix: 'nez', postfix: '.p4d'}, function(err,p4d_tempfile,fd) {
      tmp.file({prefix: 'nez', postfix: '.p4d'}, function(err,src_tempfile,fd) {
        if(err) {
            console.log(err);
            return;
        }

        var dest_file = src_tempfile + '_rev.txt';
        var exec_command = nez_command + ' -p ' + p4d_tempfile + ' ' + src_tempfile + ' -o ' + dest_file;
        console.log(exec_command);
        createFileAndExec(src_tempfile, req.body.source, p4d_tempfile, req.body.p4d, exec_command, function(stdout, stderr) {
            var data = fs.readFileSync(src_tempfile + '_rev.txt');
            if(data.length > 0) {
                var j = { error: stderr , message: stdout, source: data.toString(), runnable: true };
                genResponse(res, j);
            } else {
                var msg = "エラー訂正候補を出せませんでした";
                var error_j = { error: stderr , message: stdout, source: msg, runnable: false };
                genResponse(res, error_j);
            }
        });
      });
    });
});

router.post('/dummy/run', function(req, res) {
    console.log(req);
    var ret = {
        //src: "#include<stdio.h>\n\nint main() {\n\tprintf(\"hello\n\");\n}\n",
        output:"parse result"
    };
    res.json(ret);
});

module.exports = router;
