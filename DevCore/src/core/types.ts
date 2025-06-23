// src/core/types.ts

export interface Component {
    id: string;
    name: string;
    start(): void;
    stop(): void;
}

export interface Config {
    port: number;
    logLevel: 'info' | 'warn' | 'error';
    model: string;
}

export interface Metrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
}

export type EventCallback = (event: string, data?: any) => void;