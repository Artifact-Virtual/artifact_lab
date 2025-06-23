// src/utils/helpers.ts

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function generateRandomId(length: number = 10): string {
    return Math.random().toString(36).substr(2, length);
}

export function debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
}