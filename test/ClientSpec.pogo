client  = (require('../lib/client'))(3000)

describe 'client'
  it 'runs synchronise js on the server'
    result = client.run! @{1+1}
      
    expect(result).to.equal(2)
    
  it 'runs some async pogo on the server'
    result = client.run async pogo!
      fs =  require 'fs'
      fs.readdir!(process.cwd(), ^)
      
    expect(result).to.include('node_modules')

  it 'runs some async js on the server'
    result = client.run async js! @(callback)
      fs =  require 'fs'
      fs.readdir(process.cwd(), callback)

    expect(result).to.include('node_modules')
