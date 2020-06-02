// user-defined constants
const PORT = 3000;
const IP = "127.0.0.1"; // change to 0.0.0.0 for current ip

// program constants
const JAVASCRIPT = "javascript";
const PYTHON = "python";

// imports for advanced node functionality
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

// express imports to create server
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

// set static asset folder and user JSON body parsers
app.use(express.static("public"));
app.use(express.json());

/**
* Start the server listening at PORT number.
*/
server.listen(PORT, IP, () => {
    console.log("Server running on http://" + IP + ":" + PORT);
});

/**
 * Serve the web application.
 */
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

/**
 * Send all the problem names.
 */
const problems = fs.readdirSync("problems");
app.get("/problems", (req, res) => {
    res.send({
        problems: problems
    })
});

/**
 * Code Problem Text Endpoint
 */
let cachedProblems = {};
app.get("/problem/:name/:lang", (req, res) => {
    // get problem name and language the problem is from request
    const problem = req.params.name;
    const language = req.params.lang;
    
    // cache problems so don't have to read file on each request which could be blocking
    let problemText;
    if (problem in cachedProblems)
        problemText = cachedProblems[problem + getFileExtension(language)];
    else {
        problemText = fs.readFileSync(path.join("problems", problem, problem + getFileExtension(language) + ".md"), "utf-8").toString();

        cachedProblems[problem + getFileExtension(language)] = problemText;
    }
        
    // send text of problem markdown file
    res.send({
        problem: problemText
    });
});

/**
 * Code Submission Endpoint
 */
app.post("/submit", (req, res) => {
    // get language from request body
    const language = req.body["language"];
    const problem = req.body["problem"];

    // get code from request body and add module export for function testings
    const code = req.body["code"] + "\n" + "module.exports = " + problem + ";";

    // get proper file extension depending on language
    const fileExtension = getFileExtension(language);

    // save file
    const filename = new Date().getTime() + fileExtension;
    fs.writeFileSync(filename, code);

    console.log("\nSaved file to " + filename);

    console.log("Commencing tests.");
    
    // create arguments for mocha command
    const testPath = path.join("problems", problem, problem + ".test.js");
    const fileToTest = "--totest " + filename;

    // run the file
    runCommand("mocha", [testPath, fileToTest], (stdout, stderr, exitCode) => {
        console.log("Testing process exited with exit code", exitCode + ".");

        // remove trailing whitespace that results from reading the output stream
        stdout = stdout.trim();

        // if there is errors, get rid of any references to our filepath
        if (stderr) {
            // get the full filepath of the code file
            const filePath = path.join(process.cwd(), testPath);
            
            // replace all instances of that with generic "app.js" name
            const regex = new RegExp(filePath, "g");
            stderr = stderr.replace(regex, "app.js");
        }

        // delete file after its been tested
        fs.unlinkSync(filename);

        console.log("Deleted file at " + filename);

        // send response back to frontend
        res.send({
            output: stdout,
            error: stderr,
            solved: !exitCode
        });
    });
});

/**
* Given a language, it will return the file extension of that language.
* 
* @param {String} language 
*/
function getFileExtension(language) {
    switch (language) {
        case JAVASCRIPT:
            return ".js";
        case PYTHON:
            return ".py";
    }
}

/**
* This will execute code and provide the output, error, and exit code
* via a callback function.
* 
* @param {String} command 
* @param {[String]} args 
* @param {Function} callback 
*/
function runCommand(command, args, callback) {
    // start process
    const child = child_process.spawn(command, args);

    // get the output of code
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", function(data) {
        stdout += data.toString();
    });

    // get any errors from code
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", function(data) {
        stderr += data.toString();
    });

    // when the child process closes naturally
    child.on("close", function(code) {
        // use callback to give data
        callback(stdout, stderr, code);
    });
}