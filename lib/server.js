(function() {
    var Promise = require("bluebird");
    var self = this;
    var serverRequire;
    serverRequire = function(path) {
        if (path[0] === ".") {
            path = process.cwd() + "/" + path;
        }
        return require(path);
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
                options.context.Promise = require("bluebird");
                options.context.gen1_promisify = function(callback) {
                    var self = this;
                    return callback(function(error, result) {
                        return emitResult(options, result);
                    });
                };
                return convertErrorToEmit(options, function() {
                    return exec(options.context, options.func);
                });
            };
            exec = function(context, func, callback) {
                var runFunc;
                context.process = process;
                context.require = require;
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
                var context, runFunc, result;
                context = options.context;
                context.Promise = require("bluebird");
                context.process = process;
                context.require = require;
                context.serverRequire = serverRequire;
                runFunc = Function("context", "\n        for (var property in context) {\n          eval ('var '+property+'= context.'+property);\n        }\n\n        // in a task we just need to swallow root level promises that complete\n        var gen1_promisify = function(fn) {\n            return new Promise(function(onFulfilled, onRejected) {\n                fn(function(error, result) {\n                    if (error) {\n                        onRejected(error);\n                    } else {\n                        onFulfilled(result);\n                    }\n                });\n            });\n        };\n\n        return (" + options.func + ")();\n      ");
                result = runFunc(context);
                tasks.push({
                    id: options.id,
                    stop: result.stop
                });
                return socket.emit("running:" + options.id, result);
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
                    var gen3_results, gen4_items, gen5_i, task;
                    gen3_results = [];
                    gen4_items = tasks;
                    for (gen5_i = 0; gen5_i < gen4_items.length; ++gen5_i) {
                        task = gen4_items[gen5_i];
                        (function(task) {
                            if (task.id === options.id) {
                                return gen3_results.push(task);
                            }
                        })(task);
                    }
                    return gen3_results;
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