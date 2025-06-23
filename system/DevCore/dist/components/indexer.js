"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Indexer {
    constructor() {
        this.fileIndex = new Map();
    }
    addFile(filePath, dependencies) {
        this.fileIndex.set(filePath, dependencies);
    }
    removeFile(filePath) {
        this.fileIndex.delete(filePath);
    }
    getDependencies(filePath) {
        return this.fileIndex.get(filePath);
    }
    getAllFiles() {
        return Array.from(this.fileIndex.keys());
    }
    clearIndex() {
        this.fileIndex.clear();
    }
}
exports.default = Indexer;
