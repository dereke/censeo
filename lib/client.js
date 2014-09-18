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
                            return socket.on("error:" + options.id, error);
                        });
                    }));
                });
            },
            runTask: function(func, gen3_options) {
                var self = this;
                var context;
                context = gen3_options !== void 0 && Object.prototype.hasOwnProperty.call(gen3_options, "context") && gen3_options.context !== void 0 ? gen3_options.context : {};
                var options, gen4_asyncResult, socket;
                return new Promise(function(gen2_onFulfilled) {
                    options = {
                        func: func.toString(),
                        context: context
                    };
                    gen2_onFulfilled(Promise.resolve(self.getSocket()).then(function(gen4_asyncResult) {
                        socket = gen4_asyncResult;
                        return new Promise(function(success, error) {
                            options.id = ++self.count;
                            socket.emit("runTask", options);
                            socket.on("error:" + options.id, error);
                            return running(socket, options, success);
                        });
                    }));
                });
            },
            run: function(func, gen5_options) {
                var self = this;
                var promises, context;
                promises = gen5_options !== void 0 && Object.prototype.hasOwnProperty.call(gen5_options, "promises") && gen5_options.promises !== void 0 ? gen5_options.promises : false;
                context = gen5_options !== void 0 && Object.prototype.hasOwnProperty.call(gen5_options, "context") && gen5_options.context !== void 0 ? gen5_options.context : {};
                var options;
                options = {
                    func: func.toString(),
                    context: context
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