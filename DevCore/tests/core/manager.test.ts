import { Manager } from '../../src/core/manager';

describe('Manager Class', () => {
    let manager: Manager;

    beforeEach(() => {
        manager = new Manager();
    });

    test('should initialize correctly', () => {
        expect(manager).toBeDefined();
    });

    test('should start components', () => {
        const startSpy = jest.spyOn(manager, 'startComponents');
        manager.startComponents();
        expect(startSpy).toHaveBeenCalled();
    });

    test('should stop components', () => {
        const stopSpy = jest.spyOn(manager, 'stopComponents');
        manager.stopComponents();
        expect(stopSpy).toHaveBeenCalled();
    });

    test('should handle component lifecycle', () => {
        const component = { start: jest.fn(), stop: jest.fn() };
        manager.addComponent(component);
        manager.startComponents();
        expect(component.start).toHaveBeenCalled();
        manager.stopComponents();
        expect(component.stop).toHaveBeenCalled();
    });
});