(function() {
    var Promise = require("bluebird");
    var self = this;
    module.exports = function(port) {
        var self = this;
        var io;
        io = require("socket.io")();
        io.on("connection", function(socket) {
            var convertErrorToEmit, runWithPromise, runWithCallback, run;
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
            runWithPromise = function(options) {
                var Promise, gen1_promisify;
                Promise = require("bluebird");
                gen1_promisify = function(callback) {
                    return callback(function(error, result) {
                        return socket.emit("ran:" + options.id, result);
                    });
                };
                return convertErrorToEmit(options, function() {
                    return eval("(" + options.func + ")()");
                });
            };
            runWithCallback = function(options) {
                var callback;
                callback = function(error, result) {
                    return socket.emit("ran:" + options.id, result);
                };
                return convertErrorToEmit(options, function() {
                    return eval("(" + options.func + ")(" + callback.toString() + ")");
                });
            };
            run = function(options) {
                return convertErrorToEmit(options, function() {
                    return socket.emit("ran:" + options.id, eval("(" + options.func + ")()"));
                });
            };
            return socket.on("run", function(options) {
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
        });
        return io.listen(port);
    };
}).call(this);