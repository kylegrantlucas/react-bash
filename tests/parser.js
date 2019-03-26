import chai from 'chai';
import * as FishParser from '../src/parser';

describe('FishParser', () => {

    describe('parseInput', () => {
        it('should exist', () => {
            chai.assert.isFunction(FishParser.parseInput);
        });

        it('should handle a simple command', () => {
            const { name, input } = FishParser.parseInput('ls');
            chai.assert.strictEqual(name, 'ls');
            chai.assert.strictEqual(input, 'ls');
        });

        it('should handle no args', () => {
            const { name, flags } = FishParser.parseInput('ls');
            chai.assert.strictEqual(name, 'ls');
            chai.assert.strictEqual(Object.keys(flags).length, 0);
        });

        it('should handle anonymous args', () => {
            const { args } = FishParser.parseInput('ls arg1 arg2');
            chai.assert.strictEqual(args[0], 'arg1');
            chai.assert.strictEqual(args[1], 'arg2');
        });

        it('should handle named args', () => {
            const { args } = FishParser.parseInput('ls --test arg1');
            chai.assert.strictEqual(args.test, 'arg1');
        });

        it('should handle boolean flags', () => {
            const { flags } = FishParser.parseInput('ls -l -a');
            chai.assert.strictEqual(Object.keys(flags).length, 2);
            chai.assert.strictEqual(flags.l, true);
            chai.assert.strictEqual(flags.a, true);
        });

        it('should handle grouped boolean flags', () => {
            const { flags } = FishParser.parseInput('ls -la');
            chai.assert.strictEqual(Object.keys(flags).length, 2);
            chai.assert.strictEqual(flags.l, true);
            chai.assert.strictEqual(flags.a, true);
        });

    });

    describe('parse', () => {

        it('should exist', () => {
            chai.assert.isFunction(FishParser.parse);
        });

        it('should handle a simple command', () => {
            const parsedData = FishParser.parse('ls');
            chai.assert.strictEqual(parsedData.length, 1);
            chai.assert.strictEqual(parsedData[0].length, 1);
            chai.assert.strictEqual(parsedData[0][0].name, 'ls');
        });

        it('should handle multiple commands with ;', () => {
            const [parsedData] = FishParser.parse('ls -la; cd test');
            const command1 = parsedData[0];
            const command2 = parsedData[1];
            chai.assert.strictEqual(command1.name, 'ls');
            chai.assert.strictEqual(command1.flags.l, true);
            chai.assert.strictEqual(command1.flags.a, true);
            chai.assert.strictEqual(command2.name, 'cd');
            chai.assert.strictEqual(command2.args[0], 'test');
        });

        it('should handle multiple commands with &&', () => {
            const dependencyList = FishParser.parse('ls -a && cd test');
            const [dep1, dep2] = dependencyList;
            chai.assert.strictEqual(dependencyList.length, 2);
            chai.assert.strictEqual(dep1[0].name, 'ls');
            chai.assert.strictEqual(dep1[0].flags.a, true);
            chai.assert.strictEqual(dep2[0].name, 'cd');
            chai.assert.strictEqual(dep2[0].args[0], 'test');
        });
    });
});
