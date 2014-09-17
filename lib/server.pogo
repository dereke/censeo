module.exports(port)=
  io = (require('socket.io'))()
  tasks = []
  io.on('connection') @(socket)
    serverRequire(path)=
      if (path.0 == '.')
        path := "#(process.cwd())/#(path)"

      require(path)

    convert error to emit(options, run)=
      try
        run!()
      catch(e)
        socket.emit("error:#(options.id)", e)
        
    emit result(options, result)=
      if (options.task)
        tasks.push({
          id = options.id
          stop = result.stop
        })
        socket.emit("running:#(options.id)", result)
      else
        socket.emit("ran:#(options.id)", result)
  
    run with promise(options)=
      Promise = require 'bluebird'
      gen1_promisify(callback)=
        callback() @(error, result)
          emit result(options, result)

      convert error to emit(options)
        eval("(#(options.func))()")  
        
    run with callback(options)=
      callback(error, result)=
        emit result(options, result)

      convert error to emit(options)
        eval("(#(options.func))(#(callback.toString()))")
        
    run(options)=
      convert error to emit(options)
        result = eval("(#(options.func))()")
        emit result(options, result)

    socket.on('run') @(options)
      if(options.promise)
        run with promise(options)
      else
        if (options.callback)
          run with callback(options)
        else
          run(options)
          
    socket.on('stop') @(options)
      runningTask = [task <- tasks, task.id == options.id, task].0
      
      if (runningTask)
        runningTask.stop!(^)
        tasks.splice(tasks.indexOf(runningTask), 1)
        socket.emit("stopped:#(options.id)")

  io.listen(port)
