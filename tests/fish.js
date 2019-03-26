import chai from 'chai';
import sinon from 'sinon';
import { stateFactory } from './factories';
import Fish from '../src/fish';
import { Errors } from '../src/const';

describe('fish class', () => {

    describe('with extensions', () => {

        it('should add extensions to commands', () => {
            const fish = new Fish();
            chai.assert.isDefined(fish.prevCommands);
            chai.assert.strictEqual(fish.prevCommands.length, 0);
            chai.assert.isDefined(fish.prevCommandsIndex);
            chai.assert.strictEqual(fish.prevCommandsIndex, 0);
        });

        it('should add extensions to commands', () => {
            const noop = () => {};
            const fish = new Fish({ test: noop });
            chai.assert.isFunction(fish.commands.test);
            chai.assert.strictEqual(fish.commands.test, noop);
        });

    });

});

describe('fish class methods', () => {
    const mockState = stateFactory();
    let fish;

    beforeEach(() => {
        fish = new Fish();
    });

    describe('execute', () => {

        it('should exist', () => {
            chai.assert.isFunction(fish.execute);
        });

        it('should append command to prevCommands', () => {
            fish.execute('test', mockState);
            chai.assert.strictEqual(fish.prevCommands.length, 1);
            chai.assert.strictEqual(fish.prevCommands[0], 'test');
        });

        it('should increase prevCommandsIndex', () => {
            fish.execute('test', mockState);
            chai.assert.strictEqual(fish.prevCommandsIndex, 1);
        });

        it('should add input to history', () => {
            const { history } = fish.execute('ls', mockState);
            chai.assert.strictEqual(history.length, 2);
            chai.assert.strictEqual(history[0].value, 'ls');
            chai.assert.strictEqual(history[0].cwd, '');
        });

        it('should not break on empty input', () => {
            const { history } = fish.execute('', mockState);
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, '');
        });

        // Full command testing is in tests/command.js
        const commands = [
            { command: 'help' },
            { command: 'clear' },
            { command: 'ls', args: 'dir1' },
            { command: 'cat', args: 'file1' },
            { command: 'mkdir', args: 'testDir' },
            { command: 'cd', args: 'dir1' },
        ];

        commands.forEach(data => {
            it(`should handle the ${data.command} command`, () => {
                const stub = sinon.stub(fish.commands[data.command], 'exec');
                fish.execute(`${data.command} ${data.args}`, mockState);
                chai.assert.strictEqual(stub.called, true);
                stub.restore();
            });
        });

        it('should handle unknown commands', () => {
            const expected = Errors.COMMAND_NOT_FOUND.replace('$1', 'commandDoesNotExist');
            const { history } = fish.execute('commandDoesNotExist', mockState);
            chai.assert.strictEqual(history.length, 2);
            chai.assert.strictEqual(history[1].value, expected);
        });

        it('should only print the unknown command in error', () => {
            const expected = Errors.COMMAND_NOT_FOUND.replace('$1', 'commandDoesNotExist');
            const { history } = fish.execute('commandDoesNotExist -la test/file.txt', mockState);
            chai.assert.strictEqual(history[1].value, expected);
        });

        it('should handle multiple commands with ;', () => {
            const { history } = fish.execute('cd dir1; pwd', mockState);
            chai.assert.strictEqual(history.length, 2);
            chai.assert.strictEqual(history[1].value, '/dir1');
        });

        it('should handle multiple commands with successful &&', () => {
            const { history } = fish.execute('cd dir1 && pwd', mockState);
            chai.assert.strictEqual(history.length, 2);
            chai.assert.strictEqual(history[1].value, '/dir1');
        });

        it('should handle multiple commands with unsuccessful &&', () => {
            const input = 'cd doesNotExist && pwd';
            const expected1 = Errors.NO_SUCH_FILE.replace('$1', 'doesNotExist');
            const { history } = fish.execute(input, mockState);
            chai.assert.strictEqual(history.length, 2);
            chai.assert.strictEqual(history[0].value, input);
            chai.assert.strictEqual(history[1].value, expected1);
        });

    });

    describe('getPrevCommand', () => {

        it('should exist', () => {
            chai.assert.isFunction(fish.getPrevCommand);
        });

        it('should return previous command', () => {
            fish.prevCommandsIndex = 2;
            fish.prevCommands = [0, 1, 2];
            chai.assert.strictEqual(fish.getPrevCommand(), 1);
        });

    });

    describe('getNextCommand', () => {

        it('should exist', () => {
            chai.assert.isFunction(fish.getNextCommand);
        });

        it('should return next command', () => {
            fish.prevCommandsIndex = 1;
            fish.prevCommands = [0, 1, 2];
            chai.assert.strictEqual(fish.getNextCommand(), 2);
        });

    });

    describe('hasPrevCommand', () => {

        it('should exist', () => {
            chai.assert.isFunction(fish.hasPrevCommand);
        });

        it('should return false if index is 0', () => {
            fish.prevCommandsIndex = 0;
            chai.assert.strictEqual(fish.hasPrevCommand(), false);
        });

        it('should return true if index is not 0', () => {
            fish.prevCommandsIndex = 1;
            chai.assert.strictEqual(fish.hasPrevCommand(), true);
        });

    });

    describe('hasNextCommand', () => {

        it('should exist', () => {
            chai.assert.isFunction(fish.hasNextCommand);
        });

        it('should return false if at last index', () => {
            fish.prevCommands = [];
            fish.prevCommandsIndex = 0;
            chai.assert.strictEqual(fish.hasNextCommand(), true);
        });

        it('should return true if not at last index', () => {
            fish.prevCommands = [null, null];
            fish.prevCommandsIndex = 0;
            chai.assert.strictEqual(fish.hasNextCommand(), true);
        });

    });

    describe('autocomplete', () => {

        it('should exist', () => {
            chai.assert.isFunction(fish.autocomplete);
        });

        it('should autocomplete a command', () => {
            const expected = 'help';
            const actual = fish.autocomplete('he', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should not autocomplete a path if input has only one token', () => {
            const expected = null;
            const actual = fish.autocomplete('dir', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should not autocomplete a command if input has more than one token', () => {
            const expected = null;
            const actual = fish.autocomplete('ls he', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should autocomplete a directory name', () => {
            const expected = 'ls dir1';
            const actual = fish.autocomplete('ls di', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should autocomplete a file name', () => {
            const expected = 'ls file1';
            const actual = fish.autocomplete('ls fil', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should autocomplete a path', () => {
            const expected = 'ls dir1/childDir';
            const actual = fish.autocomplete('ls dir1/chi', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should not autocomplete commands on paths', () => {
            const expected = null;
            const actual = fish.autocomplete('ls dir1/clea', mockState);
            chai.assert.strictEqual(expected, actual);
        });

        it('should autocomplete a path with .. in it', () => {
            const expected = 'ls ../../dir1';
            const state = Object.assign({}, mockState, { cwd: 'dir1/childDir' });
            const actual = fish.autocomplete('ls ../../dir', state);
            chai.assert.strictEqual(expected, actual);
        });

    });

});

