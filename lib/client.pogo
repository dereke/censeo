module.exports(port)=
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

    exec(type, func)=
      socket = self.get socket!()
      promise @(success, error)
        call id = ++self.count
        socket.emit("run:#(type)", { 
          func  = func.toString()
          id    = call id
        })

        socket.on("ran:#(call id)", success)
        socket.on("error:#(call id)", error)

    run(func)=
      self.exec('sync', func)

    run async pogo(func)=
      self.exec('async-pogo', func)

    run async js(func)=
      self.exec('async-js', func)
  }