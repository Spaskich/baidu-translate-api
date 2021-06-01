const querystring = require("querystring");

const request = require("request");
const apiToken = require("./token");
const cookie = require("./cookie");
const store = require("./store");
const globalConfig = require('./globalConfig');

const { transapi } = require("./constant");

const language = require("./language");
const { Auto, English } = language;

class Translate {
    constructor(query, opts) {
        this.query = query;
        this.opts = {
            from: Auto,
            to: English,
            requestOpts: {},
            ...opts
        };
    }

    request() {
        const { from, requestOpts } = this.opts;

        return new Promise(resolve => {
            if (from !== Auto) {
                resolve()
            } else {
                this.langdetect().then(lan => {
                    this.opts.from = lan;
                    resolve();
                });
            }
        }).then(() => {
            // let retries = 1;
            // console.log("res: " + res[0].exception.statusCode)

            // while (res[0].exception.statusCode === 401 && retries > 0) {
            //     console.log("retries: " + retries);
            //     retries--;
            //
            //     res = cookie.get(requestOpts).then(() => this.trans()).catch(e => console.log(e));
            // }

            return cookie.get(requestOpts).then(() => this.trans());
        }); 
    }

    trans() {
        const { query, opts } = this;
        const { requestOpts } = opts;

        return new Promise((resolve, reject) => {
            apiToken.get(query, requestOpts, false).then(({ sign, token }) => {
                var data = {
                    query, sign, token,
                    from: opts.from,
                    to: opts.to,
                    transtype: "realtime",
                    simple_means_flag: 3,
                };
                const url = `${transapi.v2}?${querystring.stringify(data)}`;
                const jar = request.jar();
                const cookies = store.getCookies();

                jar.setCookie(cookies.value, url);

                request(url, { jar, ...requestOpts }, (err, res, body) => {

                    if (err) return reject(err);

                    if (res.statusCode !== 200) {
                        if (res.statusCode === 401) {
                            apiToken.get(query, requestOpts, true).then(r => sign, token);
                        }

                        return reject({
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage
                        });
                    }

                    try {
                        const result = JSON.parse(body);

                        try {
                            if (result.error || result.errno) return reject(result);

                            const { trans_result } = result;
                            const { from, to } = trans_result;
                            const { dst, src } = trans_result.data[0];

                            resolve({
                                from,
                                to,
                                trans_result: {
                                    dst,
                                    src
                                }
                            });
                        } catch (err) {
                            console.log("translate.js:101 - result: [" + JSON.stringify(result) + "]");
                            reject(err);
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        });
    }

    langdetect() {
        return new Promise((resolve, reject) => {
            const url = `${transapi.langdetect}?query=${encodeURIComponent(this.query)}`;

            request(url, this.opts.requestOpts, (err, res, body) => {
                if (err) return reject(err);

                try {
                    let result = JSON.parse(body);

                    if (result.error) return reject(result);
                    
                    resolve(result.lan);
                } catch (err) {
                    return reject(err);
                }
            });
        });
    }
}



module.exports = function translate(query, opts = {}) {
    return new Translate(query, opts).request();
};

module.exports.setGlobalConfig = function(config) {
    Object.assign(globalConfig, config);
}

module.exports.language = language;
