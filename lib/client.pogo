module.exports(port)=

  running(socket, options, success)=
    socket.on("running:#(options.id)")
      success({
        stop()=          
          promise @(success)
            socket.on("stopped:#(options.id)", success)
            socket.emit("stop", options)
      })
      
      


  {
    get socket()=
      promise @(success)
        if (self.socket)
          success(self.socket)
        else
          io = require 'socket.io-client'
          self.socket = io("http://localhost:#(port)")    
          self.socket.on 'connect'
            success(self.socket)        

    count = 0
    
    
    exec(options)=
      socket = self.get socket!()
      promise @(success, error)      
        options.id = ++self.count
        socket.emit("run", options)
        socket.on("ran:#(options.id)", success)
        running(socket, options, success)
        socket.on("error:#(options.id)", error)

    run(promises: false, task: false, func)=
      options = {
        func = func.toString()
        task = task
      }
      if (promises)
        options.promise = true
      else      
        if (func.length == 1)
          options.callback = true
        
      self.exec(options, func)
  }