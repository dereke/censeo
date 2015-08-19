client  = (require('../client'))(3001)
request = require 'reqwest'

describe 'client'
  describe 'synchronise JavaScript'
    it 'runs on the server'
      result = client.run! @{1+1}

      expect(result).to.equal(2)

    it 'throws an error when one occurs on the server'
      try
        client.run! @{ @throw @new Error 'SERVER ERROR' }
      catch(e)
        expect(e.message).to.equal('SERVER ERROR')

  describe 'marshall data from client to server'
    it'passes variables to the server'
      result = client.run!(context: {year = 2014})
        year + 1

      expect(result).to.equal(2015)

  describe 'asynchronise PogoScript'
    it 'runs on the server'
      result = client.run!()
        fs = require 'fs'
        fs.readdir!(process.cwd(), ^)

      expect(result).to.include('node_modules')

    it 'runs a foreach on the server'
      result = client.run!()
        double(value)=
          promise @(success)
            success(value*2)

        sum = 0
        for each @(item) in ([1,2,3])
          sum := sum + double!(item)

        sum

      expect(result).to.equal(12)

    it 'throws an error when one occurs on the server'
      try
        client.run!() @{ @throw @new Error 'SERVER ERROR'}
      catch(e)
        expect(e.message).to.equal('SERVER ERROR')

  describe 'require a file on the server'
    it'requires the correct file'
      result = client.run!
        test = serverRequire './test/requireFile'
        test()

      expect(result).to.be.true

    it 'requires a file that does not exist'
      try
        client.run!
          serverRequire './test/doesNotExist'

        @throw @new Error 'Should Not Reach This Code'
      catch(e)
        expect(e.message).to.contain("Censeo could not find the file")
        expect(e.message).to.contain("./test/doesNotExist")


  describe 'long running task'
    it 'runs on the server and can be stopped later' @(done) =>
      self.timeout(5000)
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

      try
        request!({url = server url})
      catch(e)
        if (e.status == 0)
          done()
        else
          @throw e

    it'runs a task containing promises' @(done)
      task = client.runTask!()
        fs = require 'fs'
        fs.readdir!(process.cwd(), ^)
        asyncTaskRan = false
        intervalId = setInterval
          fs.readdir!(process.cwd(), ^)
          asyncTaskRan := true
        200

        {
          stop(done)=
            clearInterval(intervalId)
            done(asyncTaskRan)
        }

      setTimeout
        result = task.stop!()
        expect(result).to.be.true
        done()
      500

    it 'returns arbitrary data from the task' @(done)
      task = client.runTask!()
        {
          stop(done)=
            done()

          data = {
            a = 'b'
            c = [1,2]
          }
        }

      expect(task.data).to.eql {
        a = 'b'
        c = [1,2]
      }

      setTimeout
        task.stop!()
        done()
      500

  it 'returns the error when starting a task fails' @(done)
    try
      client.runTask!()
        null.invalidMethodCall()
    catch(e)
      expect(e.message).to.contain("'invalidMethodCall' of null")
      done()

