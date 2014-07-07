# censeo

Run arbitrary JavaScript or PogoScript on a server.

*Please use this responsibly.*

Preferable only in test code

# Insructions

First of all you need to start up the server specifying a port number to use.
If you are using karma you may want to put this in your `karma.conf.js` file.

```
require('censeo').server(3001)
```


Next you want to create a client:

```
client  = require('censeo').client(3001)
```

Then in your test (you should only use this for tests!).

```
client
  .run(function() {
    return 1 + 1;
  }).then(function(result){
    expect(result).to.equal(2)
  })
```

You can also run async code on the server

```
client
  .run(function(callback) {
      var fs = require("fs");
      fs.readdir(process.cwd(), callback);
  }).then(function(result) {
      expect(result).to.include("node_modules");
  });
```

Where censeo can come in really handy is if you need to spool up a webserver to test against:

```
client
  .run(function() {
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
}, {
    task: true
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
task = client.run!(task: true)
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