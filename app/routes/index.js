///<reference path='../../typings/node/node.d.ts'/>
///<reference path='../../typings/express/express.d.ts'/>
var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var config = require('config');
var lodash = require('lodash');
//var md = require("markdown").markdown.toHTML;
var marked = require('marked');
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
});
/* GET home page. */
router.get('/', function (req, res) {
    res.render('top', { basePath: config.base.path });
});
module.exports = router;
