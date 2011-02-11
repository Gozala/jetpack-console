// vim:ts=2:sts=2:sw=2:

'use strict'

const { Handler } = require("protocol");
const { data } = require("self");

const URI = data.url("console/index.html")
const CONTENT = data.load("console/index.html")

exports.handler = Handler({
  scheme: "console",
  onRequest: function onRequest(request, response) {
    response.content = CONTENT;
    response.contentType = "text/html";
    response.originalURI = URI;
  }
})
