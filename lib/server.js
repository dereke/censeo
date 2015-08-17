(function() {
    var self = this;
    var http, socketIO, log, serverRequire, pogoWrappers;
    http = require("http");
    socketIO = require("socket.io");
    log = require("debug")("censeo:server");
    serverRequire = function(path) {
        var tryPath;
        tryPath = path;
        if (path[0] === ".") {
            tryPath = process.cwd() + "/" + path;
        }
        try {
            return require(tryPath);
        } catch (e) {
            if (e.code === "MODULE_NOT_FOUND") {
                log("censeo paths", module.paths);
                throw {
                    message: "Censeo could not find the file '" + tryPath + "'",
                    code: e.code
                };
            } else {
                throw e;
            }
        }
    };
    pogoWrappers = function() {
        return "\n //TODO it would be nice if we could just get these from pogo\n\n     var promisify = function(fn) {\n         return new Promise(function(onFulfilled, onRejected) {\n             fn(function(error, result) {\n                 if (error) {\n                     onRejected(error);\n                 } else {\n                     onFulfilled(result);\n                 }\n             });\n         });\n     }.toString();\n\n     for (var iteration=1; iteration<10; iteration++) {\n       eval('var gen'+iteration+'_promisify = ' + promisify );\n     }\n\n     var asyncFor = function(test, incr, loop) {\n       return new Promise(function(success, failure) {\n         function testAndLoop(loopResult) {\n           Promise.resolve(test()).then(function(testResult) {\n             if (testResult) {\n               Promise.resolve(loop()).then(incrTestAndLoop, failure);\n             } else {\n               success(loopResult);\n             }\n           }, failure);\n         }\n         function incrTestAndLoop(loopResult) {\n           Promise.resolve(incr()).then(function() {\n             testAndLoop(loopResult);\n           }, failure);\n         }\n         testAndLoop();\n       });\n     }.toString();\n\n\n     for (var iteration=1; iteration<10; iteration++) {\n       eval('var gen'+iteration+'_asyncFor = ' + asyncFor );\n     }\n     ";
    };
    module.exports = function(app) {
        var self = this;
        var server, tasks;
        log("Starting censeo");
        server = socketIO(app);
        tasks = [];
        return server.on("connection", function(socket) {
            var convertErrorToEmit, emitError, run;
            socket.on("error", function(e) {
                return log("Socker error " + e);
            });
            convertErrorToEmit = function(options, run) {
                var gen1_asyncResult;
                return new Promise(function(gen2_onFulfilled) {
                    gen2_onFulfilled(new Promise(function(gen2_onFulfilled) {
                        gen2_onFulfilled(Promise.resolve(run()));
                    }).then(void 0, function(e) {
                        return emitError(options, e);
                    }));
                });
            };
            emitError = function(options, error) {
                return socket.emit("error:" + options.id, {
                    message: error.message
                });
            };
            run = function(options) {
                var gen3_asyncResult;
                return new Promise(function(gen2_onFulfilled) {
                    gen2_onFulfilled(Promise.resolve(convertErrorToEmit(options, function() {
                        var func, context, runFunc, gen4_asyncResult;
                        return new Promise(function(gen2_onFulfilled) {
                            func = options.func;
                            context = options.context;
                            context.process = process;
                            context.require = serverRequire;
                            context.serverRequire = serverRequire;
                            runFunc = Function("context", "callback", "\n          for (var property in context) {\n            eval ('var '+property+'= context.'+property);\n          }\n\n          " + pogoWrappers() + "\n\n          return (" + func + ")();\n        ");
                            gen2_onFulfilled(Promise.resolve(runFunc(context)));
                        });
                    })));
                });
            };
            socket.on("runTask", function(options) {
                var gen5_asyncResult, result;
                return new Promise(function(gen2_onFulfilled) {
                    log("Run task received " + options.id);
                    gen2_onFulfilled(Promise.resolve(run(options)).then(function(gen5_asyncResult) {
                        result = gen5_asyncResult;
                        tasks.push({
                            id: options.id,
                            stop: result.stop
                        });
                        return socket.emit("running:" + options.id, result);
                    }));
                });
            });
            socket.on("run", function(options) {
                var gen6_asyncResult, result;
                return new Promise(function(gen2_onFulfilled) {
                    log("Run received " + options.id);
                    gen2_onFulfilled(Promise.resolve(run(options)).then(function(gen6_asyncResult) {
                        result = gen6_asyncResult;
                        return socket.emit("ran:" + options.id, result);
                    }));
                });
            });
            socket.on("stop", function(options) {
                var runningTask;
                log("Stop received " + options.id);
                runningTask = function() {
                    var gen7_results, gen8_items, gen9_i, task;
                    gen7_results = [];
                    gen8_items = tasks;
                    for (gen9_i = 0; gen9_i < gen8_items.length; ++gen9_i) {
                        task = gen8_items[gen9_i];
                        (function(task) {
                            if (task.id === options.id) {
                                return gen7_results.push(task);
                            }
                        })(task);
                    }
                    return gen7_results;
                }()[0];
                if (runningTask) {
                    return runningTask.stop(function(result) {
                        tasks.splice(tasks.indexOf(runningTask), 1);
                        return socket.emit("stopped:" + options.id, result);
                    });
                }
            });
            return log("Censeo server ready");
        });
    };
    module.exports.listen = function(port) {
        var self = this;
        var app;
        app = http.createServer();
        module.exports(app);
        return app.listen(port);
    };
}).call(this);