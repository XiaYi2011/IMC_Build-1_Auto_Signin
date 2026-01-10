const m = require('minecraft-protocol'),
    c = {
        username: process.env.USERNAME,
        host: 'off.imc.cab',
        port: 25565,
        version: '1.8.9',
        protocolVersion: 47,
        password: process.env.PASSWORD
    };

function s(e) {
    return new Promise(t => setTimeout(t, e))
}

function p(e) {
    if (!e) return '';
    if (typeof e == 'string') {
        try {
            return u(JSON.parse(e))
        } catch {
            return e
        }
    }
    return typeof e == 'object' ? u(e) : String(e)
}

function u(e) {
    if (!e) return '';
    let t = '';
    if (e.text) t += e.text;
    if (e.extra && Array.isArray(e.extra)) e.extra.forEach(r => t += u(r));
    if (e.translate) {
        t += e.translate;
        if (e.with) e.with.forEach(r => t += ' ' + u(r))
    }
    return t
}

function f(e) {
    return e ? String(e).replace(/§[0-9a-fk-or]/gi, '') : ''
}

function d(e) {
    if (!e) return '未知';
    if (typeof e == 'string') return f(e);
    if (typeof e == 'object') return f(p(e));
    return String(e)
}
async function g() {
    return new Promise((e, t) => {
        m.ping({
            host: c.host,
            port: c.port,
            version: c.version
        }, (r, o) => {
            if (r) {
                console.error('Ping失败:', r.message);
                t(r)
            } else {
                console.log('————————————————————————————————————\n服务器信息:');
                try {
                    console.log('描述:', d(o.description))
                } catch {
                    console.log('描述: [解析失败]')
                }
                console.log('在线人数:', o.players.online, '/', o.players.max);
                if (o.players && o.players.sample) console.log('在线玩家:', o.players.sample.map(n => n.name).join(', '));
                console.log('延迟:', o.latency, 'ms\n协议版本:', o.version.protocol, '\n————————————————————————————————————');
                e(o)
            }
        })
    })
}
async function h() {
    console.log('IMC建筑服签到bot启动...\n');
    try {
        console.log('1.正在Ping服务器...');
        await g();
        await s(1000);
        console.log('\n2.正在连接服务器...');
        const e = m.createClient({
                host: c.host,
                port: c.port,
                username: c.username,
                version: c.version,
                keepAlive: true,
                hideErrors: false,
                auth: 'offline'
            }),
            t = {
                h: false,
                i: false,
                n: null
            };
        e.on('chat', async r => {
            try {
                const o = p(r.message),
                    n = f(o);
                if (n.trim()) {
                    console.log(`${n}`);
                    if (n.toLowerCase().includes('login')) {
                        console.log('检测到login字段...');
                        e.write('chat', {
                            message: `/l ${c.password}`
                        });
                        console.log('已发送登录命令')
                    }
                    if (t.h && n.includes('你需要绑定才能进入这个服务器，如果你已经绑定，请重连服务器')) {
                        console.log('未绑定，错误退出');
                        e.end();
                        process.exit(1)
                    }
                    if (t.i && n.includes('才能再次领取该奖励!')) {
                        console.log('签到失败，错误退出');
                        e.end();
                        process.exit(1)
                    }
                }
            } catch {}
        });
        e.on('message', r => {
            try {
                if (r.message) {
                    const o = p(r.message),
                        n = f(o);
                    if (n.trim()) console.log(`${n}`)
                }
            } catch {}
        });
        e.on('login', async () => {
            console.log('成功加入服务器!');
            await s(1000);
            if (!t.h) {
                console.log('\n3.正在切换到build-1...');
                e.write('chat', {
                    message: '/server build-1'
                });
                t.h = true;
                t.n = setTimeout(async () => {
                    if (!t.i) {
                        console.log('\n4.正在执行签到...');
                        e.write('chat', {
                            message: '/signin'
                        });
                        t.i = true;
                        setTimeout(() => {
                            console.log('\n签到完成!\n————————————————————————————————————');
                            console.log('正在断开连接...');
                            e.end();
                            process.exit(0)
                        }, 1000)
                    }
                }, 1000)
            }
        });
        e.on('position', () => {});
        e.on('error', r => {
            console.error('连接错误:', r.message);
            if (t.n) clearTimeout(t.n)
        });
        e.on('end', () => {
            console.log('连接已断开');
            if (t.n) clearTimeout(t.n)
        });
        e.on('disconnect', r => {
            if (r.reason) try {
                console.log('断开连接原因:', f(p(r.reason)))
            } catch {
                console.log('断开连接')
            }
            if (t.n) clearTimeout(t.n)
        })
    } catch (r) {
        console.error('程序出错:', r.message);
        process.exit(1)
    }
}
h();