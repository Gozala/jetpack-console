// vim:ts=2:sts=2:sw=2:

"use strict";

const { Loader } = require('cuddlefish');
const { Handler } = require("protocol");
const { data } = require("self");
const { PageMod } = require("page-mod");
const { source } = require("type");

const URI = data.url("console/index.html")
const ROOT = URI.substr(0, URI.lastIndexOf("/") + 1)

exports.sandbox = (new Loader({
  console: console,
  globals: { packaging: packaging },
  packaging: packaging,
  rootPaths: packaging.options.rootPaths
})).findSandboxForModule("console/sandbox");

exports.handler = Handler({
  onRequest: function onRequest(request, response) {
    if (request.referer && 0 !== request.uri.indexOf("console:")) {
      let uri = request.uri
      if ('/' == uri[0]) uri = uri.substr(1)
      response.uri = ROOT + uri
    } else {
      response.content = data.load("console/index.html");
      response.originalURI = URI;
    }
  }
});

let gWorker

exports.mod = PageMod({
  include: "console:*",
  contentScript: 'new ' + function Worker() {
    self.on("message", function onMessage(data) {
      window.postMessage(data, "*")
    })
    window.addEventListener("message", function (event) {
      event.stopPropagation();
      self.postMessage(event.data)
    }, false);
  },
  onAttach: function onAttach(worker) {
    if (!gWorker) {
      worker.on("message", function onMessage(message) {
        let data = JSON.parse(message)
        if (data.cmd) {
          let result
          try {
            result = ["response", source(exports.sandbox.evaluate(data.cmd))]
          } catch (e) {
            result = ["error", source(e)]
          }
          worker.postMessage(JSON.stringify(result))
        }
      })
      gWorker = worker
    }
  }
});

exports.handler.listen({ scheme: 'console' })
