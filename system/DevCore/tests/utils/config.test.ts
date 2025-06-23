import { loadConfig, saveConfig } from '../../src/utils/config';

describe('Config Utility Functions', () => {
    const testConfig = {
        key1: 'value1',
        key2: 'value2',
    };

    beforeEach(() => {
        // Reset any changes made to the config before each test
        saveConfig(testConfig);
    });

    afterEach(() => {
        // Clean up after each test
        saveConfig({});
    });

    test('should load configuration correctly', () => {
        const config = loadConfig();
        expect(config).toEqual(testConfig);
    });

    test('should save configuration correctly', () => {
        const newConfig = {
            key1: 'newValue1',
            key2: 'newValue2',
        };
        saveConfig(newConfig);
        const config = loadConfig();
        expect(config).toEqual(newConfig);
    });
});