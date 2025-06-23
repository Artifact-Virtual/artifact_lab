"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Watcher {
    constructor(path) {
        this.fs = require('fs');
        this.path = path;
        this.events = {};
    }
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach((listener) => listener(data));
        }
    }
    startWatching() {
        this.fs.watch(this.path, (eventType, filename) => {
            if (filename) {
                this.emit(eventType, filename);
            }
        });
    }
    stopWatching() {
        // Logic to stop watching can be implemented here
    }
}
exports.default = Watcher;
