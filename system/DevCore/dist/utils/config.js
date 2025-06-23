"use strict";
// src/utils/config.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfigValue = exports.getConfigValue = exports.loadConfig = void 0;
function loadConfig(filePath) {
    // Logic to load configuration from a file
    return {};
}
exports.loadConfig = loadConfig;
function getConfigValue(config, key, defaultValue = null) {
    return config.hasOwnProperty(key) ? config[key] : defaultValue;
}
exports.getConfigValue = getConfigValue;
function setConfigValue(config, key, value) {
    config[key] = value;
}
exports.setConfigValue = setConfigValue;
