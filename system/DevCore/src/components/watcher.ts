class Watcher {
    private fs: any;
    private path: string;
    private events: any;

    constructor(path: string) {
        this.fs = require('fs');
        this.path = path;
        this.events = {};
    }

    public on(event: string, listener: Function): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    private emit(event: string, data: any): void {
        if (this.events[event]) {
            this.events[event].forEach((listener: Function) => listener(data));
        }
    }

    public startWatching(): void {
        this.fs.watch(this.path, (eventType: string, filename: string) => {
            if (filename) {
                this.emit(eventType, filename);
            }
        });
    }

    public stopWatching(): void {
        // Logic to stop watching can be implemented here
    }
}

export default Watcher;