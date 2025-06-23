class Indexer {
    private fileIndex: Map<string, string[]>;

    constructor() {
        this.fileIndex = new Map();
    }

    public addFile(filePath: string, dependencies: string[]): void {
        this.fileIndex.set(filePath, dependencies);
    }

    public removeFile(filePath: string): void {
        this.fileIndex.delete(filePath);
    }

    public getDependencies(filePath: string): string[] | undefined {
        return this.fileIndex.get(filePath);
    }

    public getAllFiles(): string[] {
        return Array.from(this.fileIndex.keys());
    }

    public clearIndex(): void {
        this.fileIndex.clear();
    }
}

export default Indexer;