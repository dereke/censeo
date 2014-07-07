module.exports(port)=
  io = (require('socket.io'))()
  io.on('connection') @(socket)
    convert error to emit(options, run)=
      try
        run!()
      catch(e)
        socket.emit("error:#(options.id)", e)
  
    run with promise(options)=
      Promise = require 'bluebird'
      gen1_promisify(callback)=
        callback() @(error, result)
          socket.emit("ran:#(options.id)", result)

      convert error to emit(options)
        eval("(#(options.func))()")  
        
    run with callback(options)=
      callback(error, result)=
        socket.emit("ran:#(options.id)", result)

      convert error to emit(options)
        eval("(#(options.func))(#(callback.toString()))")
        
    run(options)=
      convert error to emit(options)
        socket.emit("ran:#(options.id)", eval("(#(options.func))()"))

    socket.on('run') @(options)
      if(options.promise)
        run with promise(options)
      else
        if (options.callback)
          run with callback(options)
        else
          run(options)

  io.listen(port)