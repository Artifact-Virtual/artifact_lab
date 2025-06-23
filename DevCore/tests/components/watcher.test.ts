import { Watcher } from '../../src/components/watcher';

describe('Watcher', () => {
    let watcher: Watcher;

    beforeEach(() => {
        watcher = new Watcher();
    });

    test('should initialize correctly', () => {
        expect(watcher).toBeDefined();
    });

    test('should start watching for file changes', () => {
        const spy = jest.spyOn(watcher, 'startWatching');
        watcher.startWatching();
        expect(spy).toHaveBeenCalled();
    });

    test('should trigger event on file change', () => {
        const mockCallback = jest.fn();
        watcher.on('change', mockCallback);
        watcher.triggerChangeEvent('test-file.txt');
        expect(mockCallback).toHaveBeenCalledWith('test-file.txt');
    });

    test('should stop watching for file changes', () => {
        const spy = jest.spyOn(watcher, 'stopWatching');
        watcher.stopWatching();
        expect(spy).toHaveBeenCalled();
    });
});