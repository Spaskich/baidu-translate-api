// const translate = require("baidu-translate-api");

const translate = require("../translate");
const grazeLanguages = {
    auto: "Auto",
    zh: "Chinese",
    en: "English",
    ja: "Japanese",
    ko: "Korean",
    fr: "French",
    es: "Spanish",
    th: "Thai",
    ar: "Arabic",
    ru: "Russian",
    pt: "Portuguese",
    de: "German",
    it: "Italian",
    el: "Greek",
    nl: "Dutch",
    pl: "Polish",
    bg: "Bulgarian",
    et: "Estonian",
    da: "Danish",
    fi: "Finnish",
    cd: "Czech",
    ro: "Romanian",
    sl: "Slovenia",
    sv: "Swedish",
    hu: "Hungarian",
    vi: "Vietnamese"
}

function mapLanguages (languageKey) {
    if (grazeLanguages.hasOwnProperty(languageKey)) {
        return translate.language[grazeLanguages[languageKey]];
    } else {
        return translate.language["Auto"];
    }
}

module.exports = { mapLanguages };