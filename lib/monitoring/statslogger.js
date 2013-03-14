// -----------------
// StatsLogger
// -----------------
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var START = require('../config').NODELOAD_CONFIG.START;
var LogFile = require('../stats').LogFile;
}

/** StatsLogger writes interval stats from a Monitor or MonitorGroup to disk each time it emits 'update' */
var StatsLogger = exports.StatsLogger = function StatsLogger(monitor, logNameOrObject, jtlLogNameOrObject) {
    this.logNameOrObject = logNameOrObject || ('results-' + START.toISOString() + '-stats.log');
    this.jtlLogNameOrObject = jtlLogNameOrObject || ('results-' + START.toISOString() + '-stats.jtl');
    this.monitor = monitor;
    this.logger_ = this.log_.bind(this);
};
StatsLogger.prototype.start = function() {
    this.createdLog = (typeof this.logNameOrObject === 'string');
    this.createdJtlLog = (typeof this.jtlLogNameOrObject === 'string');
    this.log = this.createdLog ? new LogFile(this.logNameOrObject) : this.logNameOrObject;
    this.jtlLog = this.createdJtlLog ? new LogFile(this.jtlLogNameOrObject) : this.jtlLogNameOrObject;
	this.jtlLog.put('<?xml version="1.0" encoding="UTF-8"?>\n<testResults version="1.2">\n');
    this.monitor.on('update', this.logger_);
    return this;
};
StatsLogger.prototype.stop = function() {
    if (this.createdLog) {
        this.log.close();
        this.log = null;
    }
    if (this.createdJtlLog) {
		this.jtlLog.putSync('</testResults>\n');
        this.jtlLog.close();
        this.jtlLog = null;
    }
    this.monitor.removeListener('update', this.logger_);
    return this;
};
StatsLogger.prototype.log_ = function() {
    var summary = this.monitor.interval.summary();
    this.log.put(JSON.stringify(summary) + ',\n');
    this.jtlLog.put('<httpSample t="' + Math.round(summary.latency.avg) + '" ts="' + new Date(summary.ts).getTime() + '" s="true" by="' + summary['response-bytes'].total + '" lb="' + summary.name + '"/>\n');
};
