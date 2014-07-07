(function() {
    var Promise = require("bluebird");
    var self = this;
    module.exports = function(port) {
        var self = this;
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
            exec: function(type, func) {
                var self = this;
                var gen1_asyncResult, socket;
                return new Promise(function(gen2_onFulfilled) {
                    gen2_onFulfilled(Promise.resolve(self.getSocket()).then(function(gen1_asyncResult) {
                        socket = gen1_asyncResult;
                        return new Promise(function(success, error) {
                            var callId;
                            callId = ++self.count;
                            socket.emit("run:" + type, {
                                func: func.toString(),
                                id: callId
                            });
                            socket.on("ran:" + callId, success);
                            return socket.on("error:" + callId, error);
                        });
                    }));
                });
            },
            run: function(func) {
                var self = this;
                return self.exec("sync", func);
            },
            runAsyncPogo: function(func) {
                var self = this;
                return self.exec("async-pogo", func);
            },
            runAsyncJs: function(func) {
                var self = this;
                return self.exec("async-js", func);
            }
        };
    };
}).call(this);