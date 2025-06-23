"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logLevel = Logger.levels[level] || Logger.levels.info;
        console.log(`[${timestamp}] [${logLevel}]: ${message}`);
    }
    info(message) {
        this.log(message, 'info');
    }
    warn(message) {
        this.log(message, 'warn');
    }
    error(message) {
        this.log(message, 'error');
    }
    debug(message) {
        this.log(message, 'debug');
    }
}
Logger.levels = {
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    debug: 'DEBUG',
};
exports.default = Logger;
