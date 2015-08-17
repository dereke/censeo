botname = (require 'botname')()
console.log('Client name', botname)

CenseoError(message, code)=
  this.message = message
  this.code = code

CenseoError.prototype = new(Error())
CenseoError.prototype.name = "CenseoError"
CenseoError.prototype.consturctor = CenseoError

module.exports(port)=
  requestId = 0
  newRequestId()=
    ++requestId
    "#(botname):#(requestId)"

  unWrapError(doThrow)=
    receiveError(error)=
      doThrow(new(CenseoError(error.message)))

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

    exec(options)=
      socket = self.get socket!()
      promise @(success, error)      
        options.id = newRequestId()
        socket.on("ran:#(options.id)", success)
        socket.on("error:#(options.id)", unWrapError(error))
        socket.emit("run", options)

    runTask(context = {}, func)=
      options = {
        func    = func.toString()
        context = context
      }

      socket = self.get socket!()
      promise @(success, error)      
        options.id = newRequestId()
        socket.emit("runTask", options)
        socket.on("error:#(options.id)", unWrapError(error))
        running(socket, options, success)

    run(promises = false, context = {}, func)=
      options = {
        func    = func.toString()
        context = context
      }
      if (promises)
        options.promise = true
      else      
        if (func.length == 1)
          options.callback = true
        
      self.exec(options, func)
  }
