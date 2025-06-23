"use strict";
// src/utils/helpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.debounce = exports.generateRandomId = exports.formatDate = void 0;
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
exports.formatDate = formatDate;
function generateRandomId(length = 10) {
    return Math.random().toString(36).substr(2, length);
}
exports.generateRandomId = generateRandomId;
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
exports.debounce = debounce;
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
exports.isEmpty = isEmpty;
