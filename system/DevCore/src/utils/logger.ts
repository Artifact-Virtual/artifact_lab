class Logger {
    static levels: { [key: string]: string } = {
        info: 'INFO',
        warn: 'WARN',
        error: 'ERROR',
        debug: 'DEBUG',
    };

    log(message: string, level: string = 'info'): void {
        const timestamp = new Date().toISOString();
        const logLevel = Logger.levels[level] || Logger.levels.info;
        console.log(`[${timestamp}] [${logLevel}]: ${message}`);
    }

    info(message: string): void {
        this.log(message, 'info');
    }

    warn(message: string): void {
        this.log(message, 'warn');
    }

    error(message: string): void {
        this.log(message, 'error');
    }

    debug(message: string): void {
        this.log(message, 'debug');
    }
}

export default Logger;