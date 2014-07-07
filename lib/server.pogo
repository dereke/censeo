module.exports(port)=
  io = (require('socket.io'))()
  io.on('connection') @(socket)
    socket.on('run:sync') @(req)
      socket.emit("ran:#(req.id)", eval("(#(req.func))()"))

    socket.on('run:async-pogo') @(req)
      Promise = require 'bluebird'
      gen1_promisify(callback)=
        callback() @(error, result)
          socket.emit("ran:#(req.id)", result)

      eval("(#(req.func))()")

    socket.on('run:async-js') @(req)
      callback(error, result)=
        socket.emit("ran:#(req.id)", result)

      eval("(#(req.func))(#(callback.toString()))")

  io.listen(port)