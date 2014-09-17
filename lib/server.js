(function() {
    var Promise = require("bluebird");
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
    var self = this;
    module.exports = function(port) {
        var self = this;
        var io, tasks;
        io = require("socket.io")();
        tasks = [];
        io.on("connection", function(socket) {
            var serverRequire, convertErrorToEmit, emitResult, runWithPromise, runWithCallback, run;
            serverRequire = function(path) {
                if (path[0] === ".") {
                    path = process.cwd() + "/" + path;
                }
                return require(path);
            };
            convertErrorToEmit = function(options, run) {
                var gen2_asyncResult;
                return new Promise(function(gen3_onFulfilled) {
                    gen3_onFulfilled(new Promise(function(gen3_onFulfilled) {
                        gen3_onFulfilled(Promise.resolve(run()));
                    }).then(void 0, function(e) {
                        return socket.emit("error:" + options.id, e);
                    }));
                });
            };
            emitResult = function(options, result) {
                if (options.task) {
                    tasks.push({
                        id: options.id,
                        stop: result.stop
                    });
                    return socket.emit("running:" + options.id, result);
                } else {
                    return socket.emit("ran:" + options.id, result);
                }
            };
            runWithPromise = function(options) {
                var Promise, gen1_promisify;
                Promise = require("bluebird");
                gen1_promisify = function(callback) {
                    return callback(function(error, result) {
                        return emitResult(options, result);
                    });
                };
                return convertErrorToEmit(options, function() {
                    return eval("(" + options.func + ")()");
                });
            };
            runWithCallback = function(options) {
                var callback;
                callback = function(error, result) {
                    return emitResult(options, result);
                };
                return convertErrorToEmit(options, function() {
                    return eval("(" + options.func + ")(" + callback.toString() + ")");
                });
            };
            run = function(options) {
                return convertErrorToEmit(options, function() {
                    var result;
                    result = eval("(" + options.func + ")()");
                    return emitResult(options, result);
                });
            };
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
                var runningTask, gen4_asyncResult;
                return new Promise(function(gen3_onFulfilled) {
                    runningTask = function() {
                        var gen5_results, gen6_items, gen7_i, task;
                        gen5_results = [];
                        gen6_items = tasks;
                        for (gen7_i = 0; gen7_i < gen6_items.length; ++gen7_i) {
                            task = gen6_items[gen7_i];
                            (function(task) {
                                if (task.id === options.id) {
                                    return gen5_results.push(task);
                                }
                            })(task);
                        }
                        return gen5_results;
                    }()[0];
                    gen3_onFulfilled(Promise.resolve(function() {
                        if (runningTask) {
                            return new Promise(function(gen3_onFulfilled) {
                                gen3_onFulfilled(gen1_promisify(function(gen8_callback) {
                                    return runningTask.stop(gen8_callback);
                                }).then(function(gen9_asyncResult) {
                                    gen9_asyncResult;
                                    tasks.splice(tasks.indexOf(runningTask), 1);
                                    return socket.emit("stopped:" + options.id);
                                }));
                            });
                        }
                    }()));
                });
            });
        });
        return io.listen(port);
    };
}).call(this);