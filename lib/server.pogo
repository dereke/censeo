serverRequire(path)=
  tryPath = path 
  if (path.0 == '.')
    tryPath := "#(process.cwd())/#(path)"

  try
    require(tryPath)
  catch(e)
    if (e.code == 'MODULE_NOT_FOUND')
      @throw {
        message = "Censeo could not find the file '#(tryPath)'"
        code = e.code
      }
    else
      @throw e

pogoWrappers()=
  "
    //TODO it would be nice if we could just get these from pogo
      
        var promisify = function(fn) {
            return new Promise(function(onFulfilled, onRejected) {
                fn(function(error, result) {
                    if (error) {
                        onRejected(error);
                    } else {
                        onFulfilled(result);
                    }
                });
            });
        }.toString();

        for (var iteration=1; iteration<10; iteration++) {
          eval('var gen'+iteration+'_promisify = ' + promisify );
        }

        var asyncFor = function(test, incr, loop) {
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
        }.toString();
        
        
        for (var iteration=1; iteration<10; iteration++) {
          eval('var gen'+iteration+'_asyncFor = ' + asyncFor );
        }
        "
        
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
        context.require = serverRequire
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
      context.require = serverRequire
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
      context.require = serverRequire
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
