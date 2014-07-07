require('./lib/server.js')(3001)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'browserify'],
    files: [
      'test/**/*Spec.pogo'
    ],


    browserify: {
      transform: ['pogoify'],
      extension: ['.pogo'],
      watch: true
    },

    preprocessors: {
      'test/**/*.pogo' : 'browserify'
    },
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],
    port: 9876,
    colors: true,
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    captureTimeout: 60000,
    singleRun: false
  });
};