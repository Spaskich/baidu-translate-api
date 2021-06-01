// const translate = require("baidu-translate-api");
const translate = require("../translate");
const logger = require("./logger-service").logger;

translate.setGlobalConfig({ useLocalStore: true });

async function translateSentence(from, to, sentence, retries = 1) {

    try {
        return await translate(sentence, {from: from, to: to}).then(result => {

            return  {
                from: from,
                to: to,
                translation: result.trans_result.dst,
                original: sentence
            };
        });
    } catch (e) {
        let exception =  constructException(e);
        if (exception.statusCode === 401 && retries > 0) {
            return await translateSentence(from, to, sentence, --retries);
        }

        logger.error(`${new Date}: Error while translating: [${sentence}]:` )
        logger.error(exception.statusCode + ": " + exception.statusMessage)

        if (exception.statusCode === 1022) {
            logger.error("Message length: " + sentence.length);
        }

        return { exception: exception };
    }
}

function constructException(e) {
    if ("statusCode" in e) {
        return { statusCode: e.statusCode, statusMessage: e.statusMessage };
    } else if ("errno" in e) {
        return { statusCode: e.errno, statusMessage: e.code };
    } else {
        return { statusCode: "unknown", statusMessage: e };
    }
}

module.exports = { translateSentence };