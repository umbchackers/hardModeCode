/**
 * Handles all the 'problem' related tasks (getting problems, problem testing, submitting)
 */
const path = require("path");
const { LANGUAGES } = require('../constants');
const child_process = require('child_process');
const fs = require("fs");
const shortid = require("shortid");

// putting this into it's own constant ensures we don't have to read the directory everytime the user requests it
// We could improve on this by allowing the server.js create a map that contains a problem ID and a path to the markdown file that 
// contains the problem. For now though, this will do.
const problems = fs.readdirSync("client/problems");
exports.problems = problems;

let cachedProblems = {};
function getProblem({ problem, language })
{
    // Is this too hacky?
    let problemText = problem in cachedProblems ? cachedProblems[problem + getFileExtension(language)] : (() => {
        let text = fs.readFileSync(path.join("./client/problems", problem, problem + getFileExtension(language) + ".md"), "utf-8").toString();
        cachedProblems[problem + getFileExtension(language)] = text;
        return text;
    })();

    return problemText;
}

function submit({ problem, language, code }, callback)
{
    // get proper file extension depending on language
    const fileExtension = getFileExtension(language);

    // save file
    const filename = `server/${shortid.generate()}${fileExtension}`;
    fs.writeFileSync(filename, code);

    console.log("\nSaved file to " + filename);
    console.log("Commencing tests.");
    
    // create arguments for mocha command
    const testPath = path.join("client/problems", problem, problem + ".test.js");
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

        callback(stdout, stderr, exitCode); 
    });
}

/**
 * This will execute code and provide the output, error, and exit code
 * via a callback function.
 * 
 * @param {String} command 
 * @param {[String]} args 
 * @param {Function} callback 
 */
async function runCommand(command, args, callback) {
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
        callback({ stdout, stderr, code }); 
    });
}

/**
 * Given a language, it will return the file extension of that language.
 * 
 * @param {String} language 
 */
function getFileExtension(language) 
{
    return LANGUAGES[language].extension || language.substring(0, 2);
}

module.exports = { getProblem, submit };
