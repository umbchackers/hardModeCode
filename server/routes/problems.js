// boilerplate for creating a express router
const express = require("express");
const router = express.Router();

const service = require("../services/problemService");

router.get("/list", (_, res) => {
    res.send({ problems: service.problems });
});

router.get("/:name/:lang", (req, res) => {
    const { name: problem, lang: language } = req.params;
    const text = service.getProblem({ problem, language });
    res.send({ problem: text });
});

router.post("/submit", (req, res) => {
    const { problem, language } = req.body;
    const code = `${req.body.code}\nmodule.exports = ${problem};`

    // this can be done better with async/awaits
    service.submit({ problem, language, code }, (output, error, solved) => {
        res.send({
            output,
            error,
            solved
        });
    });
});

module.exports = router;