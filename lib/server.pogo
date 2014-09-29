serverRequire(path)=
  if (path.0 == '.')
    path := "#(process.cwd())/#(path)"

  require(path)

pogoWrappers()=
  "
    //TODO it would be nice if we could just get these from pogo
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

        var gen2_asyncFor = function(test, incr, loop) {
          return new Promise(function(success, failure) {
            function testAndLoop(loopResult) {
              Promise.resolve(test()).then(function(testResult) {
                if (testResult) {
                  Promise.resolve(loop()).then(incrTestAndLoop, failure);
                } else {
                  success(loopResult);
                }
              }, failure);
            }
            function incrTestAndLoop(loopResult) {
              Promise.resolve(incr()).then(function() {
                testAndLoop(loopResult);
              }, failure);
            }
            testAndLoop();
          });
        };"
        
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
      convert error to emit(options)
        func    = options.func
        context = options.context

        context.Promise = require 'bluebird'
        context.process = process
        context.require = require
        context.serverRequire = serverRequire

        runFunc = Function("context", "callback", "
          for (var property in context) {
            eval ('var '+property+'= context.'+property);
          }

          #(pogoWrappers())

          return (#(func))();
        ")

        result = runFunc(context)!
        emitResult(options, result)

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

        #(pogoWrappers())

        return (#(options.func))();
      ")

      result = runFunc!(context)

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
