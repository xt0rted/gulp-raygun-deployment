var gutil = require('gulp-util');
var request = require('request');
var through = require('through2');

var constants = {
    PLUGIN_NAME: 'gulp-raygun-deployment',
    DEFAULTS: {
        host: 'https://app.raygun.io',
        authToken: process.env.RAYGUN_DEPLOY_TOKEN,
        data: {
            apiKey: process.env.RAYGUN_DEPLOY_KEY
        }
    }
};

module.exports = function(options) {
    options = Object.assign({}, constants.DEFAULTS, options);

    return through.obj(function(file, enc, cb) {
        var self = this;

        if (!options.authToken) {
            return cb(new gutil.PluginError(constants.PLUGIN_NAME, 'Raygun auth token missing'));
        }

        if (!options.data || !options.data.apiKey) {
            return cb(new gutil.PluginError(constants.PLUGIN_NAME, 'Raygun api key missing'));
        }

        request.post({
            uri: options.host + '/deployments',
            qs: { authToken: options.authToken },
            json: true,
            body: options.data
        }, function(error, res) {
            if (error) {
                cb(new gutil.PluginError(constants.PLUGIN_NAME, error));
            } else if (res.statusCode === 200) {
                gutil.log(gutil.colors.cyan('Sent deployment info to Raygun.io'));
                gutil.log(gutil.colors.green('\t', 'commit:', options.data.scmIdentifier));
                gutil.log(gutil.colors.green('\t', 'author:', options.data.ownerName));
                gutil.log(gutil.colors.green('\t', 'author email:', options.data.emailAddress));
                gutil.log(gutil.colors.green('\t', 'version:', options.data.version));
                gutil.log(gutil.colors.green('\t', 'comment:', options.data.comment));

                cb();
            } else if (res.statusCode === 403) {
                cb(new gutil.PluginError(constants.PLUGIN_NAME, 'Could not send deployment info to Raygun: your raygunApiKey is either wrong or you don\'t have access to that application'));
            } else if (res.statusCode === 401) {
                cb(new gutil.PluginError(constants.PLUGIN_NAME, 'Could not send deployment info to Raygun: your raygunAuthToken is wrong'));
            } else {
                cb(new gutil.PluginError(constants.PLUGIN_NAME, 'Could not send deployment info to Raygun: got a ' + res.statusCode + ' response code'));
            }
        });

        self.push(file);
    });
};
