// src/utils/config.ts

export interface Config {
    [key: string]: any;
}

export function loadConfig(filePath: string): Config {
    // Logic to load configuration from a file
    return {};
}

export function getConfigValue(config: Config, key: string, defaultValue: any = null): any {
    return config.hasOwnProperty(key) ? config[key] : defaultValue;
}

export function setConfigValue(config: Config, key: string, value: any): void {
    config[key] = value;
}