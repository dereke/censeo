http     = require 'http'
socketIO = require 'socket.io'
log      = (require 'debug')('censeo:server')

serverRequire(path)=
  tryPath = path
  if (path.0 == '.')
    tryPath := "#(process.cwd())/#(path)"

  try
    require(tryPath)
  catch(e)
    if (e.code == 'MODULE_NOT_FOUND')
      log('censeo paths', module.paths)
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

module.exports(server)=
  log 'Starting censeo'
  tasks = []

  server.on('connection') @(socket)
    socket.on('error') @(e)
      log("Socker error #(e)")

    convert error to emit(options, run)=
      try
        run!()
      catch(e)
        emitError(options, e)

    emitError(options, error)=
      socket.emit("error:#(options.id)", { message = error.message })

    run(options)=
      convert error to emit!(options)
        func    = options.func
        context = options.context

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

        runFunc!(context)

    socket.on('runTask') @(options)
      log "Run task received #(options.id)"
      result = run!(options)
      tasks.push({
        id = options.id
        stop = result.stop
        data = result.data
      })
      socket.emit("running:#(options.id)", result)

    socket.on('run') @(options)
      log "Run received #(options.id)"
      result = run!(options)
      socket.emit("ran:#(options.id)", result)

    socket.on('stop') @(options)
      log "Stop received #(options.id)"
      runningTask = [task <- tasks, task.id == options.id, task].0

      if (runningTask)
        result = runningTask.stop!()
        tasks.splice(tasks.indexOf(runningTask), 1)
        socket.emit("stopped:#(options.id)", result)

    log 'Censeo server ready'

module.exports.listen(port)=
  app = http.createServer()
  server = socketIO(app)
  module.exports(server)
  app.listen(port)
