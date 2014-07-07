(function() {
    var Promise = require("bluebird");
    var self = this;
    module.exports = function(port) {
        var self = this;
        var running;
        running = function(socket, options, success) {
            return socket.on("running:" + options.id, function() {
                return success({
                    stop: function() {
                        var self = this;
                        return new Promise(function(success) {
                            socket.on("stopped:" + options.id, success);
                            return socket.emit("stop", options);
                        });
                    }
                });
            });
        };
        return {
            getSocket: function() {
                var self = this;
                return new Promise(function(success) {
                    var io;
                    if (self.socket) {
                        return success(self.socket);
                    } else {
                        io = require("socket.io-client");
                        self.socket = io("http://localhost:" + port);
                        return self.socket.on("connect", function() {
                            return success(self.socket);
                        });
                    }
                });
            },
            count: 0,
            exec: function(options) {
                var self = this;
                var gen1_asyncResult, socket;
                return new Promise(function(gen2_onFulfilled) {
                    gen2_onFulfilled(Promise.resolve(self.getSocket()).then(function(gen1_asyncResult) {
                        socket = gen1_asyncResult;
                        return new Promise(function(success, error) {
                            options.id = ++self.count;
                            socket.emit("run", options);
                            socket.on("ran:" + options.id, success);
                            running(socket, options, success);
                            return socket.on("error:" + options.id, error);
                        });
                    }));
                });
            },
            run: function(func, gen3_options) {
                var self = this;
                var promises, task;
                promises = gen3_options !== void 0 && Object.prototype.hasOwnProperty.call(gen3_options, "promises") && gen3_options.promises !== void 0 ? gen3_options.promises : false;
                task = gen3_options !== void 0 && Object.prototype.hasOwnProperty.call(gen3_options, "task") && gen3_options.task !== void 0 ? gen3_options.task : false;
                var options;
                options = {
                    func: func.toString(),
                    task: task
                };
                if (promises) {
                    options.promise = true;
                } else {
                    if (func.length === 1) {
                        options.callback = true;
                    }
                }
                return self.exec(options, func);
            }
        };
    };
}).call(this);