module.exports(port)=
  io = (require('socket.io'))()
  io.on('connection') @(socket)
    convert error to emit(req, run)=
      try
        run!()
      catch(e)
        socket.emit("error:#(req.id)", e)
  
    socket.on('run:sync') @(req)
      convert error to emit(req)
        socket.emit("ran:#(req.id)", eval("(#(req.func))()"))

    socket.on('run:async-pogo') @(req)
      Promise = require 'bluebird'
      gen1_promisify(callback)=
        callback() @(error, result)
          socket.emit("ran:#(req.id)", result)

      convert error to emit(req)
        eval("(#(req.func))()")      

    socket.on('run:async-js') @(req)
      callback(error, result)=
        socket.emit("ran:#(req.id)", result)

      convert error to emit(req)
        eval("(#(req.func))(#(callback.toString()))")

  io.listen(port)