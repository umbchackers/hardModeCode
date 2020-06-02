// flag to get file from
const FLAG = "totest";

// if num tests isnt correct it will show test diagnostic info -- is that maybe good or bad?
const NUM_TESTS = 8;

// import mocha/chai testing functions
const assert = require("chai").assert;

// get file to test
const val = process.argv[3];
const fileName = val.substring(val.indexOf(FLAG) + FLAG.length + 1);
const fizz_buzz = require("../../" + fileName);

// the right answer since the secret tests are random numbers to prevent hardcoding
function calculateAnswer(n) {
    if (n % 3 === 0 && n % 5 === 0)
        return "FizzBuzz";
    else if (n % 3 === 0)
        return "Fizz";
    else if (n % 5 === 0)
        return "Buzz";
    else
        return n;
}

// test the fizzBuzz() function
describe("#fizzBuzz()", function() {
    it("n = 1 should return 1", function() {
        assert.equal(fizz_buzz(1), 1);
    });

    it("n = 5 should return 'Buzz'", function() {
        assert.equal(fizz_buzz(5), "Buzz");
    });

    it("n = 18 should return 'Fizz'", function() {
        assert.equal(fizz_buzz(18), "Fizz");
    });

    it("n = 30 should return 'FizzBuzz'", function() {
        assert.equal(fizz_buzz(30), "FizzBuzz");
    });

    it("secret test #1", function() {
        let n = Math.ceil(Math.random() * 1000);

        while (n % 3 !== 0) n = Math.ceil(Math.random() * 1000);

        assert.equal(fizz_buzz(n), calculateAnswer(n));
    });

    it("secret test #2", function() {
        let n = Math.ceil(Math.random() * 1000);

        while (n % 5 !== 0) n = Math.ceil(Math.random() * 1000);

        assert.equal(fizz_buzz(n), calculateAnswer(n));
    });

    it("secret test #3", function() {
        let n = Math.ceil(Math.random() * 1000);

        while (n % 3 !== 0 || n % 5 !== 0) n = Math.ceil(Math.random() * 1000);

        assert.equal(fizz_buzz(n), calculateAnswer(n));
    });

    it("secret test #4", function() {
        let n = Math.ceil(Math.random() * 1000);

        while (n % 3 == 0 || n % 5 == 0) n = Math.ceil(Math.random() * 1000);

        assert.equal(fizz_buzz(n), calculateAnswer(n));
    });

    let numRun = 0, numPassed = 0;
    afterEach(function() {
        ++numRun;

        if (this.currentTest.state === 'failed') {}
        else
            if (++numPassed == NUM_TESTS) 
                process.exit(0);
            else if (numRun == NUM_TESTS)
                process.exit(1);
    });
});