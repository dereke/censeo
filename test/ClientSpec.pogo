client  = (require('../lib/client'))(3000)

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