const CACHE_NAME = 'SaiodgmSW';
let cachelist = [];

self.cons = { // output
    s: (m) => {
        console.log(`%c[SUCCESS]%c ${m}`, 'color:white;background:green;', '')
    },
    w: (m) => {
        console.log(`%c[WARNING]%c ${m}`, 'color:brown;background:yellow;', '')
    },
    i: (m) => {
        console.log(`%c[INFO]%c ${m}`, 'color:white;background:blue;', '')
    },
    e: (m) => {
        console.log(`%c[ERROR]%c ${m}`, 'color:white;background:red;', '')
    },
    d: (m) => {
        console.log(`%c[DEBUG]%c ${m}`, 'color:white;background:black;', '')
    }
}

self.db = {
    read: (key, config) => {
        if (!config) { config = { type: "text" } }
        return new Promise((resolve, reject) => {
            caches.open(CACHE_NAME).then(cache => {
                cache.match(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`)).then(function (res) {
                    if (!res) resolve(null)
                    res.text().then(text => resolve(text))
                }).catch(() => {
                    resolve(null)
                })
            })
        })
    },
    write: (key, value) => {
        return new Promise((resolve, reject) => {
            caches.open(CACHE_NAME).then(function (cache) {
                cache.put(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`), new Response(value));
                resolve()
            }).catch(() => {
                reject()
            })
        })
    }
}

self.addEventListener('install', async function (installEvent) { // open cache
    self.skipWaiting();
    installEvent.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(cachelist);
            })
    );
});

const set_blog_config = (version) => { // blog settings
    self.packagename = "saiodgm-oiblog"
    self.blogversion = version
    self.blog = {
        local: 0,
        plus: [
            "oi.saiodgm.gq",
            "oiblog.pages.dev",
            "oiblog.vercel.app"
        ],
        npmmirror: [
            `https://unpkg.com/${packagename}@${blogversion}`,
            `https://cdn.jsdelivr.net/npm/${packagename}@${blogversion}`,
            `https://npm.sourcegcdn.com/npm/${packagename}@${blogversion}`,
            `https://cdn1.tianli0.top/npm/${packagename}@${blogversion}`,
            `https://adn.arcitcgn.cn/npm/${packagename}@${blogversion}`
        ]
    };
}

const handleerr = async (req, msg) => {
    return new Response(`<h1>SaiodgmSW ERROR!</h1>
    <b>${msg}</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
}

let cdn = {
    "cdnjs":  {
        cloudflare: {
            "url": "https://cdnjs.cloudflare.com/ajax/libs"
        },
        sourcegcdn: {
            "url": "https://cdnjs.sourcegcdn.com/ajax/libs"
        },
        bytecdntp: {
            "url": "https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M"
        },
        baomitu: {
            "url": "https://lib.baomitu.com"
        },
        staticfile: {
            "url": "https://cdn.staticfile.org"
        },
    },
    "gh": {
        jsdelivr: {
            "url": "https://cdn.jsdelivr.net/gh"
        },
        jsdelivr_fastly: {
            "url": "https://fastly.jsdelivr.net/gh"
        },
        jsdelivr_gcore: {
            "url": "https://gcore.jsdelivr.net/gh"
        },
        tianli: {
            "url": "https://cdn1.tianli0.top/gh"
        },
    },
    "combine": {
        jsdelivr: {
            "url": "https://cdn.jsdelivr.net/combine"
        },
        jsdelivr_fastly: {
            "url": "https://fastly.jsdelivr.net/combine"
        },
        jsdelivr_gcore: {
            "url": "https://gcore.jsdelivr.net/combine"
        },
    },
    "npm": {
        eleme: {
            "url": "https://npm.elemecdn.com"
        },
        jsdelivr: {
            "url": "https://cdn.jsdelivr.net/npm"
        },
        zhimg: {
            "url": "https://unpkg.zhimg.com"
        },
        unpkg: {
            "url": "https://unpkg.com"
        },
        bdstatic: {
            "url": "https://code.bdstatic.com/npm"
        },
        tianli: {
            "url": "https://cdn1.tianli0.top/npm"
        },
        arcitcgn: {
            "url": "https://adn.arcitcgn.cn/npm"
        }
    }
}

const blog_default_version = '1.3.1'

const handle = async (req) => {
    set_blog_config(await db.read('blog_version') || blog_default_version) // update version
    const urlStr = req.url
    const urlObj = new URL(urlStr);
    const urlPath = urlObj.pathname
    const pathname = urlObj.href.substr(urlObj.origin.length);
    const domain = urlObj.hostname;
    if (pathname.match(/\/sw\.js/g)) { return fetch(req) }
    let urls = [] // ICDN
    for (let i in cdn) {
        for (let j in cdn[i]) {
            if (domain == cdn[i][j].url.split('https://')[1].split('/')[0] && urlStr.match(cdn[i][j].url)) {
                urls = []
                for (let k in cdn[i]) {
                    urls.push(urlStr.replace(cdn[i][j].url, cdn[i][k].url))
                }
                if (urlStr.indexOf('@latest/') > -1) {
                    return lfetch(urls, urlStr)
                } else {
                    return caches.match(req).then(function (resp) {
                        return resp || lfetch(urls, urlStr).then(function (res) {
                            return caches.open(CACHE_NAME).then(function (cache) {
                                cache.put(req, res.clone());
                                return res;
                            });
                        });
                    })
                }
            }
        }
    }
    if (domain === "oi.saiodgm.gq") {
        if (blog.local) { return fetch(req) } // localhost
        // ALL-SITE-NPM
        setTimeout(async () => {
            await set_newest_blogver()
        }, 30 * 1000);
        urls = []
        for (let k in blog.plus) {
            urls.push(`https://${blog.plus[k]}` + fullpath(pathname))
        }
        for (let k in blog.npmmirror) {
            urls.push(blog.npmmirror[k] + fullpath(pathname))
        }
        const generate_blog_html = async (res) => {
            return new Response(await res.arrayBuffer(), {
                headers: {
                    'Content-Type': 'text/html;charset=utf-8'
                },
                status: res.status,
                statusText: res.statusText
            })
        }
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                caches.match(req).then(function (resp) {
                    if (!!resp) {
                        cons.s(`Cache Hited! | Origin:${urlStr}`)
                        setTimeout(() => {
                            resolve(resp)
                        }, 200);
                        setTimeout(() => {
                            lfetch(urls, urlStr).then(async function (res) {
                                return caches.open(CACHE_NAME).then(async function (cache) {
                                    cache.delete(req);
                                    cons.s(`Cache Updated! | Origin:${urlStr}`)
                                    if (fullpath(pathname).match(/\.html$/g)) {
                                        const NewRes = await generate_blog_html(res)
                                        cache.put(req, NewRes.clone());
                                        resolve(NewRes)
                                    } else {
                                        cache.put(req, res.clone());
                                        resolve(res)
                                    }
                                });
                            });
                        }, 0);
                    } else {
                        cons.w(`Cache Missed! | Origin:${urlStr}`)
                        setTimeout(() => {
                            lfetch(urls, urlStr).then(async function (res) {
                                return caches.open(CACHE_NAME).then(async function (cache) {
                                    if (fullpath(pathname).match(/\.html$/g)) {
                                        const NewRes = await generate_blog_html(res)
                                        cache.put(req, NewRes.clone());
                                        resolve(NewRes)
                                    } else {
                                        cache.put(req, res.clone());
                                        resolve(res)
                                    }
                                });
                            }).catch(function (err) {
                                resolve(caches.match(new Request('/404.html')))
                            })
                        }, 0);
                        setTimeout(() => {
                            resolve(caches.match(new Request('/404.html')))
                        }, 5000);
                    }
                })
            }, 0);
        })
    }
    return fetch(req)
}

const lfetch = async (urls, url) => {
    cons.i(`LFetch Handled! | Mirrors Count:${urls.length} | Origin: ${url}`)
    const t1 = new Date().getTime()
    if (!await privconf.read('mirror')) {
        return fetch(url)
    }
    if (!Promise.any) {
        Promise.any = function (promises) {
            return new Promise((resolve, reject) => {
                promises = Array.isArray(promises) ? promises : []
                let len = promises.length
                let errs = []
                if (len === 0) return reject(new AggregateError('All promises were rejected'))
                promises.forEach((promise) => {
                    promise.then(value => {
                        resolve(value)
                    }, err => {
                        len--
                        errs.push(err)
                        if (len === 0) {
                            reject(new AggregateError(errs))
                        }
                    })
                })
            })
        }
    }
    let controller = new AbortController();
    const PauseProgress = async (res) => {
        return new Response(await (res).arrayBuffer(), { status: res.status, headers: res.headers });
    };
    let results = Promise.any(urls.map(async urls => {
        return new Promise(async (resolve, reject) => {
            fetch(urls, {
                signal: controller.signal
            })
                .then(PauseProgress)
                .then(async res => {
                    const resn = res.clone()
                    if (resn.status == 200) {
                        controller.abort();
                        cons.s(`LFetch Success! | Time: ${new Date().getTime() - t1}ms | Origin: ${url} `)
                        resolve(resn)
                    } else {
                        reject(null)
                    }
                }).catch((e) => {
                    if (String(e).match('The user aborted a request') || String(e).match('Failed to fetch')) {
                        console.log()
                    } else if (String(e).match('been blocked by CORS policy')) {
                        cons.e(`LFetch Blocked by CORS policy! | Origin: ${url}`)
                    }
                    else {
                        cons.e(`LFetch Error! | Origin: ${url} | Resean: ${e}`)
                    }
                    reject(null)
                })
        }
        )
    }
    )).then(res => { return res }).catch(() => { return null })
    return results
}

const set_newest_blogver = async () => {
    self.packagename = "saiodgm-oiblog"
    const mirror = [
        `https://registry.npmmirror.com/${packagename}/latest`,
        `https://registry.npmjs.org/${packagename}/latest`,
        `https://mirrors.cloud.tencent.com/npm/${packagename}/latest`
    ]
    cons.i(`Searching For The Newest Version...`)
    return lfetch(mirror, mirror[0])
        .then(res => res.json())
        .then(async res => {
            if (!res.version) throw ('No Version Found!')

            const gVer = choose_the_newest_version(res.version, await db.read('blog_version') || blog_default_version)
            cons.d(`Newest Version: ${res.version} ; Local Version: ${await db.read('blog_version')} | Update answer: ${gVer}`)
            cons.s(`Update Blog Version To ${gVer}`);
            await db.write('blog_version', gVer)
            set_blog_config(gVer)
        })
        .catch(e => {
            cons.e(`Get Blog Newest Version Erorr!Reseon:${e}`);
            set_blog_config(blog_default_version)
        })
}

const choose_the_newest_version = (g1, g2) => {
    const spliter = (v) => {
        const fpart = v.split('.')[0]
        return [parseInt(fpart), v.replace(fpart + '.', '')]
    }
    const compare_npmversion = (v1, v2) => {
        const [n1, s1] = spliter(v1)
        const [n2, s2] = spliter(v2)
        cons.d(`n1:${n1} s1:${s1} n2:${n2} s2:${s2}`)
        if (n1 > n2) {
            return g1
        } else if (n1 < n2) {
            return g2
        } else if (!s1.match(/\./) && !s2.match(/\./)) {
            if (parseInt(s1) > parseInt(s2)) return g1
            else return g2
        } else {
            return compare_npmversion(s1, s2)
        }
    }
    return compare_npmversion(g1, g2)
}

setInterval(async () => {
    cons.i('Trying to fetch the newest version...')
    await set_newest_blogver()
}, 120 * 1000);
setTimeout(async () => {
    await set_newest_blogver()
}, 1000);

const privconf = {
    read: async (key) => {
        try {
            const priv_config = JSON.parse(await db.read('priv_config') || '{}')
            return typeof priv_config[key] === 'boolean' ? priv_config[key] : (key == "globalcompute" ? false : true)
        } catch (e) {
            return true
        }
    },
    change: async (key) => {
        const priv_config = JSON.parse(await db.read('priv_config') || '{}')
        if (typeof priv_config[key] != 'boolean') priv_config[key] = true
        priv_config[key] = !priv_config[key]
        await db.write('priv_config', JSON.stringify(priv_config))
    }
}

const fullpath = (path) => {
    path = path.split('?')[0].split('#')[0]
    if (path.match(/\/$/)) {
        path += 'index'
    }
    if (!path.match(/\.[a-zA-Z]+$/)) {
        path += '.html'
    }
    return path
}

self.addEventListener('fetch', async event => {
    try {
        event.respondWith(handle(event.request))
    } catch (msg) {
        event.respondWith(handleerr(event.request, msg))
    }
});