client  = (require('../lib/client'))(3001)
request = require 'reqwest'

describe 'client'
  describe 'synchronise JavaScript'
    it 'runs on the server'
      result = client.run! @{1+1}

      expect(result).to.equal(2)

    it 'throws an error when one occurs on the server'
      try
        client.run! @{ throw 'SERVER ERROR'}
      catch(e)
        expect(e).to.equal('SERVER ERROR')
   
  describe 'marshall data from client to server'
    it'passes variables to the server'
      result = client.run!(context: {year = 2014})
        year + 1

      expect(result).to.equal(2015)

  describe 'asynchronise JavaScript'
    it 'runs on the server'
      result = client.run! @(callback)
        fs =  require 'fs'
        fs.readdir(process.cwd(), callback)

      expect(result).to.include('node_modules')
      
    it 'throws an error when one occurs on the server'
      try
        client.run! @{ throw 'SERVER ERROR'}
      catch(e)
        expect(e).to.equal('SERVER ERROR')
    
  describe 'asynchronise PogoScript'
    it 'runs on the server'
      result = client.run!(promises: true)
        fs =  require 'fs'
        fs.readdir!(process.cwd(), ^)

      expect(result).to.include('node_modules')

    it 'throws an error when one occurs on the server'
      try
        client.run!(promises: true) @{ throw 'SERVER ERROR'}
      catch(e)
        expect(e).to.equal('SERVER ERROR')

  describe 'require a file on the server'
    it'requires the correct file'
      result = client.run!
        test = serverRequire './test/requireFile'
        test()

      expect(result).to.be.true
      
  describe 'long running task'
    it 'runs on the server and can be stopped later' @(done) =>
      self.timeout(5000)
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

      try
        request!({url = server url})
      catch(e)
        if (e.status == 0)
          done()
        else
          @throw e
