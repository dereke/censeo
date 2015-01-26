(function() {
    var Promise = require("bluebird");
    var self = this;
    var serverRequire, pogoWrappers;
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
        return "\n //TODO it would be nice if we could just get these from pogo\n   \n     var promisify = function(fn) {\n         return new Promise(function(onFulfilled, onRejected) {\n             fn(function(error, result) {\n                 if (error) {\n                     onRejected(error);\n                 } else {\n                     onFulfilled(result);\n                 }\n             });\n         });\n     }.toString();\n\n     for (var iteration=1; iteration<10; iteration++) {\n       eval('var gen'+iteration+'_promisify = ' + promisify );\n     }\n\n     var asyncFor = function(test, incr, loop) {\n       return new Promise(function(success, failure) {\n         function testAndLoop(loopResult) {\n           Promise.resolve(test()).then(function(testResult) {\n             if (testResult) {\n               Promise.resolve(loop()).then(incrTestAndLoop, failure);\n             } else {\n               success(loopResult);\n             }\n           }, failure);\n         }\n         function incrTestAndLoop(loopResult) {\n           Promise.resolve(incr()).then(function() {\n             testAndLoop(loopResult);\n           }, failure);\n         }\n         testAndLoop();\n       });\n     }.toString();\n     \n     \n     for (var iteration=1; iteration<10; iteration++) {\n       eval('var gen'+iteration+'_asyncFor = ' + asyncFor );\n     }\n     ";
    };
    module.exports = function(port) {
        var self = this;
        var io, tasks;
        io = require("socket.io")();
        tasks = [];
        io.on("connection", function(socket) {
            var convertErrorToEmit, emitResult, runWithPromise, exec, runWithCallback, run;
            convertErrorToEmit = function(options, run) {
                var gen1_asyncResult;
                return new Promise(function(gen2_onFulfilled) {
                    gen2_onFulfilled(new Promise(function(gen2_onFulfilled) {
                        gen2_onFulfilled(Promise.resolve(run()));
                    }).then(void 0, function(e) {
                        return socket.emit("error:" + options.id, e);
                    }));
                });
            };
            emitResult = function(options, result) {
                return socket.emit("ran:" + options.id, result);
            };
            runWithPromise = function(options) {
                return convertErrorToEmit(options, function() {
                    var func, context, runFunc, gen3_asyncResult, result;
                    return new Promise(function(gen2_onFulfilled) {
                        func = options.func;
                        context = options.context;
                        context.Promise = require("bluebird");
                        context.process = process;
                        context.require = serverRequire;
                        context.serverRequire = serverRequire;
                        runFunc = Function("context", "callback", "\n          for (var property in context) {\n            eval ('var '+property+'= context.'+property);\n          }\n\n          " + pogoWrappers() + "\n\n          return (" + func + ")();\n        ");
                        gen2_onFulfilled(Promise.resolve(runFunc(context)).then(function(gen3_asyncResult) {
                            result = gen3_asyncResult;
                            return emitResult(options, result);
                        }));
                    });
                });
            };
            exec = function(context, func, callback) {
                var runFunc;
                context.process = process;
                context.require = serverRequire;
                context.serverRequire = serverRequire;
                runFunc = Function("context", "callback", "\n        for (var property in context) {\n          eval ('var '+property+'= context.'+property);\n        }\n\n        return (" + func + ")(callback);\n      ");
                return runFunc(context, callback);
            };
            runWithCallback = function(options) {
                var callback;
                callback = function(error, result) {
                    return emitResult(options, result);
                };
                return convertErrorToEmit(options, function() {
                    return exec(options.context, options.func, callback);
                });
            };
            run = function(options) {
                return convertErrorToEmit(options, function() {
                    var result;
                    result = exec(options.context, options.func);
                    return emitResult(options, result);
                });
            };
            socket.on("runTask", function(options) {
                var context, runFunc, result, gen4_asyncResult;
                return new Promise(function(gen2_onFulfilled) {
                    context = options.context;
                    context.Promise = require("bluebird");
                    context.process = process;
                    context.require = serverRequire;
                    context.serverRequire = serverRequire;
                    runFunc = Function("context", "\n        for (var property in context) {\n          eval ('var '+property+'= context.'+property);\n        }\n\n        " + pogoWrappers() + "\n\n        return (" + options.func + ")();\n      ");
                    result = void 0;
                    gen2_onFulfilled(new Promise(function(gen2_onFulfilled) {
                        gen2_onFulfilled(Promise.resolve(runFunc(context)).then(function(gen5_asyncResult) {
                            return result = gen5_asyncResult;
                        }));
                    }).then(void 0, function(e) {
                        return console.log("Error starting task on server", e);
                    }).then(function(gen4_asyncResult) {
                        gen4_asyncResult;
                        if (result) {
                            tasks.push({
                                id: options.id,
                                stop: result.stop
                            });
                            return socket.emit("running:" + options.id, result);
                        } else {
                            return socket.emit("error:" + options.id);
                        }
                    }));
                });
            });
            socket.on("run", function(options) {
                if (options.promise) {
                    return runWithPromise(options);
                } else {
                    if (options.callback) {
                        return runWithCallback(options);
                    } else {
                        return run(options);
                    }
                }
            });
            return socket.on("stop", function(options) {
                var runningTask;
                runningTask = function() {
                    var gen6_results, gen7_items, gen8_i, task;
                    gen6_results = [];
                    gen7_items = tasks;
                    for (gen8_i = 0; gen8_i < gen7_items.length; ++gen8_i) {
                        task = gen7_items[gen8_i];
                        (function(task) {
                            if (task.id === options.id) {
                                return gen6_results.push(task);
                            }
                        })(task);
                    }
                    return gen6_results;
                }()[0];
                if (runningTask) {
                    return runningTask.stop(function(result) {
                        tasks.splice(tasks.indexOf(runningTask), 1);
                        return socket.emit("stopped:" + options.id, result);
                    });
                }
            });
        });
        return io.listen(port);
    };
}).call(this);