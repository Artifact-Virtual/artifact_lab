// This file exports shared types and interfaces used across different modules, promoting consistency.

export interface ExampleType {
    id: string;
    name: string;
    description?: string;
}

export type Status = 'active' | 'inactive' | 'pending';

export interface Config {
    settingA: boolean;
    settingB: number;
    settingC: string;
}