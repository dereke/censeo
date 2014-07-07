(function() {
    var Promise = require("bluebird");
    var self = this;
    module.exports = function(port) {
        var self = this;
        var io;
        io = require("socket.io")();
        io.on("connection", function(socket) {
            var convertErrorToEmit;
            convertErrorToEmit = function(req, run) {
                var gen1_asyncResult;
                return new Promise(function(gen2_onFulfilled) {
                    gen2_onFulfilled(new Promise(function(gen2_onFulfilled) {
                        gen2_onFulfilled(Promise.resolve(run()));
                    }).then(void 0, function(e) {
                        return socket.emit("error:" + req.id, e);
                    }));
                });
            };
            socket.on("run:sync", function(req) {
                return convertErrorToEmit(req, function() {
                    return socket.emit("ran:" + req.id, eval("(" + req.func + ")()"));
                });
            });
            socket.on("run:async-pogo", function(req) {
                var Promise, gen1_promisify;
                Promise = require("bluebird");
                gen1_promisify = function(callback) {
                    return callback(function(error, result) {
                        return socket.emit("ran:" + req.id, result);
                    });
                };
                return convertErrorToEmit(req, function() {
                    return eval("(" + req.func + ")()");
                });
            });
            return socket.on("run:async-js", function(req) {
                var callback;
                callback = function(error, result) {
                    return socket.emit("ran:" + req.id, result);
                };
                return convertErrorToEmit(req, function() {
                    return eval("(" + req.func + ")(" + callback.toString() + ")");
                });
            });
        });
        return io.listen(port);
    };
}).call(this);