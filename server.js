(function() {
    var self = this;
    module.exports = function(port) {
        var self = this;
        var io;
        io = require("socket.io")();
        io.on("connection", function(socket) {
            socket.on("run:sync", function(req) {
                return socket.emit("ran:" + req.id, eval("(" + req.func + ")()"));
            });
            socket.on("run:async-pogo", function(req) {
                var Promise, gen1_promisify;
                Promise = require("bluebird");
                gen1_promisify = function(callback) {
                    return callback(function(error, result) {
                        return socket.emit("ran:" + req.id, result);
                    });
                };
                return eval("(" + req.func + ")()");
            });
            return socket.on("run:async-js", function(req) {
                var callback;
                callback = function(error, result) {
                    return socket.emit("ran:" + req.id, result);
                };
                return eval("(" + req.func + ")(" + callback.toString() + ")");
            });
        });
        return io.listen(port);
    };
}).call(this);