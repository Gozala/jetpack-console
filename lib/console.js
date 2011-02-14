// vim:ts=2:sts=2:sw=2:

"use strict";

const { Loader } = require('cuddlefish');
const { Handler } = require("protocol");
const { data } = require("self");
const { PageMod } = require("page-mod");
const { stringify } = require("./console/utils")

const URI = data.url("console/index.html")
const CONTENT = data.load("console/index.html")
const ROOT = URI.substr(0, URI.lastIndexOf("/") + 1)

exports.sandbox = (new Loader({
  console: console,
  globals: { packaging: packaging },
  packaging: packaging,
  rootPaths: packaging.options.rootPaths
})).findSandboxForModule("console/sandbox");

exports.handler = Handler({
  onRequest: function onRequest(request, response) {
    if (request.referer) {
      response.uri = ROOT + request.uri
    } else {
      response.content = CONTENT;
      response.contentType = "text/html";
      response.originalURI = ROOT.substr(0, ROOT.length - 1);
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
      self.postMessage(event.data)
    }, false);
  },
  onAttach: function onAttach(worker) {
    if (gWorker !== worker) {
      worker.on("message", function onMessage(message) {
        let data = JSON.parse(message)
        if (data.cmd) {
          let result
          try {
            result = ["response", stringify(exports.sandbox.evaluate(data.cmd))]
          } catch (e) {
            result = ["error", stringify(e)]
          }
          worker.postMessage(JSON.stringify(result))
        }
      })
      gWorker = worker
    }
  }
});

exports.handler.listen({ scheme: 'console' })
