const socket = io();
let problem = "";
let theme = "light";

// create a CodeMirror instance
const editor = CodeMirror(document.getElementById("editor"), {
    mode: "javascript",
    lineNumbers: true,
    styleActiveLine: { nonEmpty: true },
    indentUnit: 4
});

// whenever the server sends a problem name, show that problem
socket.on("problem", msg => {
    problem = msg.problem;

    getProblem(problem);
});

/**
 * Setup the web application.
 */
(function initUI() {
    // display problem carousel at top of page
    // populateCarousel(editor);

    // automatically focus on the editor when page loads
    editor.focus();

    // disable mouse clicks on editor
    disableEditorMouseClicks();

    // prevent user from accesing the right-click ("context") menu.
    disableContextMenu();

    // disable keys that would allow user to edit their input
    disableEditingKeys();

    document.getElementById("reset").onclick = reset;
    document.getElementById("submit").onclick = submit;
    document.getElementById("switchTheme").onclick = toggleLightingTheme;
})();

/**
 * 
 */
function populateCarousel() {
    fetch("/problem/list")
    .then(response => response.json())
    .then(data => {
        // ref to problem carousel div

        // list of all problem names
        const problems = data.problems;

        // for every problem create a button
        for (let problem of problems) {
            // create span to act as button
            let problemButton = document.createElement("span");

            // build the span
            problemButton.className = "problemButton";
            problemButton.innerHTML = problem;
            problemButton.onclick = (e) => { 
                // reset value and focus on editor
                editor.setValue("");
                editor.focus();

                // check if there is already an active button to untoggle
                const activeButton = document.getElementsByClassName("problemButton active");
                if (activeButton.length)
                    activeButton[0].classList.toggle("active");

                // toggle active state of clicked button
                e.target.classList.toggle("active");

                // get problem text that we clicked
                getProblem(editor, e.target.innerHTML); 
            };

            // add span to carousel
            problemCarousel.appendChild(problemButton);
        }
    });
}

/**
 * Switch in between light and dark mode.
 */
function toggleLightingTheme() {
    const button = document.getElementById("switchTheme");

    // set dark mode
    if (theme == "light") {
        theme = "dark";

        editor.setOption("theme", "material-darker");

        // change button styling
        button.innerText = "Light Mode";
        button.style.color = "black";
        button.style.background = "white";
    }
    // set light mode
    else {
        theme = "light";

        editor.setOption("theme", "default");

        // change button styling
        button.innerText = "Dark Mode";
        button.style.color = "white";
        button.style.background = "black";
    }
}

/**
 * Reset the value of the CodeMirror editor instance.
 */
let numResets = 0;
function reset() {
    // overwrite editor previous value with nothing
    editor.setValue("");

    // focus back on the editor
    editor.focus();

    document.getElementById("numResets").innerHTML = ++numResets;
}

/**
 * Submit the code to the server to be tested.
 */
function submit() {
    // get code from CodeMirror editor
    const code = editor.getValue();
    const mode = editor.getOption("mode");

    // convert code to JSON entity for POST request
    const data = { language: mode, code: code, problem: problem };

    // create request object
    const request = new Request("/problem/submit", { method: "POST", headers: new Headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(data) });

    // send request to server
    fetch(request)
        .then(response => response.json())
        .then(data => {
            // show console errors and output
            document.getElementById("console").innerHTML = data.output;
            document.getElementById("console").innerHTML += `<p style="color: red">${data.error}</p>`;

            // if all tests passed, it is solved and stop counting time
            if (data.solved) {
                stopStopwatch();

                alert("Solved!");

                // TODO calculate score with number of resets, number of lines, number of attempts, and time?
            }
        });
}

/**
 * Get problem text and generate HTML from the MD
 */
function getProblem(problem) {
    // reset number of resets per problem
    numResets = 0;

    // reset timer for new problem
    timer = 0;

    // get the problem text
    const language = editor.getOption("mode");
    fetch("/problem/" + problem + "/" + language)
        .then(response => response.json())
        .then(data => {
            // create a markdown to HTML converter to generate GitHub Flavored Markdown
            const converter = new showdown.Converter();
            converter.setFlavor('github');

            // set problem div to generated problem HTML
            document.getElementById("problem").innerHTML = converter.makeHtml(data.problem);

            // syntax highlight code blocks
            document.querySelectorAll("code").forEach(el => {
                // give the element a code mirror class to allow for syntax highlighting via css
                el.className = "cm-s-default";

                // run the element through CodeMirror syntax highlighting
                CodeMirror.runMode(el.innerText, editor.getOption("mode"), el);
            });

            // reset the number of resets
            numResets = 0;
            document.getElementById("numResets").innerHTML = numResets;

            // start the timer
            startStopwatch();
        });
}

/**
 * Start a stopwatch that tracks the seconds passed.
 */
let interval = 0;
let stopwatch;
function startStopwatch() {
    // clear any old timer running
    clearInterval(interval);

    // get reference to timer HTML element
    const stopwatchDisplay = document.getElementById("stopwatch");
    stopwatchDisplay.innerHTML = "00:00";

    // start stopwatch 
    stopwatch = 0;
    interval = setInterval(() => {
        // increment num seconds
        stopwatch++;

        // pad the minutes
        let minutes = Math.floor(stopwatch / 60);
        if (minutes.toString().length == 1)
            minutes = "0" + minutes;

        // pad the seconds
        let seconds = stopwatch % 60;
        if (seconds.toString().length == 1)
            seconds = "0" + seconds;

        // show stopwatch time
        stopwatchDisplay.innerHTML = minutes + ":" + seconds;
    }, 1000);
}

/**
 * Stop the timer.
 */
function stopStopwatch() {
    clearInterval(interval);
}

/**
 * Prevent user from accesing the right-click ("context") menu.
 */
function disableContextMenu() {
    document.addEventListener('contextmenu', e => e.preventDefault());
}

/**
 * Prevent Cmd/Ctrl and Backspace key events that would allow users to edit
 * their code.
 */
function disableEditingKeys() {
    document.body.addEventListener("keydown", (e) => {
        // if Cmd/Ctrl key or backspace
        if (e.metaKey || e.which == 8 || [37, 38, 39, 40].includes(e.which)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

/**
 * Disable mouse clicking within the CodeMirror editor.
 */
function disableEditorMouseClicks() {
    editor.on("mousedown", (instance, e) => {
        // focus on the editor when it get's clicked
        editor.focus();

        // do not allow any other normal click behaviors to happen
        e.preventDefault();
    });
}

/**
 * Listen for changes in the language selection, on a change event, change
 * the CodeMirror instance mode to allow for syntax highlighting.
 */
document.getElementById("language").addEventListener("change", (e) => {
    // get the newly selected language
    const languageChoice = e.srcElement.value;

    // convert the language select value into a CodeMirror mode value
    let mode;
    switch (languageChoice) {
        case "JavaScript":
            mode = "javascript";
            break;
        case "Python":
            mode = "python";
            break;
    }

    // change the CodeMirror instance mode
    editor.setOption("mode", mode);
});