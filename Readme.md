# censeo

Run arbitrary JavaScript or PogoScript on a server.

*Please use this responsibly.*

Preferable only in test code

# Insructions

First of all you need to start up the server specifying a port number to use.
If you are using karma you may want to put this in your `karma.conf.js` file.

```
require('censeo').server.listen(3001)
```

or if you already have an http server

```
require('censeo').server(http)
```

Next you want to create a client:

```
client  = require('censeo').client(3001)
```

where 3001 is the port censeo is running on

Then in your test (you should only use this for tests!).

```
client
  .run(function() {
    return 1 + 1;
  }).then(function(result){
    expect(result).to.equal(2)
  })
```

or

```
client
  .run(function() {
      var fs = require("fs");
      return new Promise(function(success){
        fs.readdir(process.cwd(), success);
      });
  }).then(function(result) {
      expect(result).to.include("node_modules");
  });
```

Where censeo can come in really handy is if you need to spool up a webserver to test against.
To do this we use `runTask` which lets you start a task and stop it at a later point:

```
client
  .runTask(function() {
    var http, app, server;
    http = require("http");
    app = http.createServer(function(req, res) {
        var headers;
        headers = {
            "Content-Type": "text/plain",
            Connection: "Close",
            "Access-Control-Allow-Headers": "accept, x-requested-with, content-type",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Origin": req.headers.origin
        };
        if (req.method === "OPTIONS") {
            res.writeHead(204, headers);
            return res.end("OK");
        } else {
            res.writeHead(200, headers);
            return res.end("ALIVE");
        }
    });
    server = app.listen(8555);
    console.log("listening on 8555");
    return {
        stop: function(done) {
            var self = this;
            return server.close(done);
        }
    };
}).then(function(task){
  // make some http requests to the server
  // then stop the server
  task.stop(function(){
    console.log('stopped')
  })
})
```

# [PogoScript](http://pogoscript.org)

PogoScript makes using censeo even better:

```
result = client.run! @{1+1}
expect(result).to.equal(2)
```

or to run a web server
```
task = client.runTask!()
  http    = require 'http'
  app = http.createServer @(req, res)
    headers = {
      'Content-Type'                  = 'text/plain'
      'Connection'                    = 'Close'
      'Access-Control-Allow-Headers'  = 'accept, x-requested-with, content-type'
      'Access-Control-Allow-Methods'  = 'GET, OPTIONS'
      'Access-Control-Allow-Origin'   = req.headers.origin
    }
    if (req.method == 'OPTIONS')
      res.writeHead(204, headers)
      res.end('OK')
    else
      res.writeHead(200, headers)
      res.end('ALIVE')

  server  = app.listen(8555)
  console.log "listening on 8555"
  {
    stop(done)=
      server.close(done)
  }

server url = 'http://localhost:8555'

response = request!({url = server url})
expect(response).to.equal('ALIVE')

task.stop!()
```
