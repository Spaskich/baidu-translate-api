const express = require("express");
const bodyParser = require('body-parser');
const languageMapper = require("./language-mapper");
const translator = require("./baidu-translator");
const logger = require("./logger-service").logger;

if (typeof localStorage === "undefined" || localStorage === null) {
    const LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./server', 1024);
}

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';
const UNAUTHORIZED_TIME = 30;
// const UNAUTHORIZED_TIME = 30 * 60 * 1000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.listen(PORT, HOST, () => {
    logger.info(`Server running on ${HOST}:${PORT}`);
});

app.post("/", async(req, res, next) => {
    let from = languageMapper.mapLanguages(req.body.from);
    let to = languageMapper.mapLanguages(req.body.to);
    let sentences = req.body.sentences;

    // logger.info(`${new Date()}: Received translation request from ${from} to ${to}: [${sentences}].`);

    let currentTime = new Date();
    let unauthorizedTime = new Date(localStorage.getItem("unauthorizedTime"));
    let timeElapsed = currentTime - unauthorizedTime;
    let resultMap = [];

    if (timeElapsed > UNAUTHORIZED_TIME) {
        for (let sentence of sentences) {
            resultMap.push(await retryTranslate(from, to, sentence));
        }
    } else {
        logger.info("Not enough time has passed since last 'Unauthorized' exception.");
        logger.info("Time elapsed: " + convertMillisecondsToDigitalClock(timeElapsed).clock);

        resultMap.push({
            exception: {
                statusCode: 400,
                statusMessage: "Not enough time has passed since last 'Unauthorized' exception."
            }
        });
    }

    res.json(resultMap);
});

async function retryTranslate(from, to, sentence, retries = 2) {
    let result = await translator.translateSentence(from, to, sentence);

    if ("exception" in result) {
        switch (result.exception.statusCode) {
            case 401:
                localStorage.setItem('unauthorizedTime', new Date().toString());
                break;
            case 'ETIMEDOUT':
                if (retries > 0) {
                    // logger.info("Retrying. Retries left: " + retries);
                    return await retryTranslate(from, to, sentence, retries - 1);
                }
                break;
        }
    }

    return result;
}

function convertMillisecondsToDigitalClock(ms) {
    let hours = Math.floor(ms / 3600000), // 1 Hour = 36000 Milliseconds
        minutes = Math.floor((ms % 3600000) / 60000), // 1 Minutes = 60000 Milliseconds
        seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
    return {
        hours : hours,
        minutes : minutes,
        seconds : seconds,
        clock : hours + ":" + minutes + ":" + seconds
    };
}