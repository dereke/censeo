serverRequire(path)=
  if (path.0 == '.')
    path := "#(process.cwd())/#(path)"

  require(path)

module.exports(port)=
  io = (require('socket.io'))()
  tasks = []
  io.on('connection') @(socket)
    convert error to emit(options, run)=
      try
        run!()
      catch(e)
        socket.emit("error:#(options.id)", e)
        
    emit result(options, result)=
      socket.emit("ran:#(options.id)", result)
 
    run with promise(options)=
      options.context.Promise = require 'bluebird'
      options.context.gen1_promisify(callback)=
        callback() @(error, result)
          emit result(options, result)

      convert error to emit(options)
        exec(options.context, options.func)

    exec(context, func, callback)=
      context.process = process
      context.require = require
      context.serverRequire = serverRequire

      runFunc = Function("context", "callback", "
        for (var property in context) {
          eval ('var '+property+'= context.'+property);
        }

        return (#(func))(callback);
      ")

      runFunc(context, callback)
        
    run with callback(options)=
      callback(error, result)=
        emit result(options, result)

      convert error to emit(options)
        exec(options.context, options.func, callback)
        
    run(options)=
      convert error to emit(options)
        result = exec(options.context, options.func)
        emit result(options, result)

    socket.on('runTask') @(options)
      context = options.context 

      context.Promise = require 'bluebird'
      context.process = process
      context.require = require
      context.serverRequire = serverRequire

      runFunc = Function("context", "
        for (var property in context) {
          eval ('var '+property+'= context.'+property);
        }

        // in a task we just need to swallow root level promises that complete
        var gen1_promisify = function(fn) {
            return new Promise(function(onFulfilled, onRejected) {
                fn(function(error, result) {
                    if (error) {
                        onRejected(error);
                    } else {
                        onFulfilled(result);
                    }
                });
            });
        };

        return (#(options.func))();
      ")

      result = runFunc(context)

      tasks.push({
        id = options.id
        stop = result.stop
      })
      socket.emit("running:#(options.id)", result)

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
        runningTask.stop() @(result)
          tasks.splice(tasks.indexOf(runningTask), 1)
          socket.emit("stopped:#(options.id)", result)

  io.listen(port)
