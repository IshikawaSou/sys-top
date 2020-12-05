const path = require('path');
const { ipcRenderer } = require('electron');
const osu = require('node-os-utils');
const cpu = osu.cpu;
const mem = osu.mem;
const os = require('os');

let cpuOverload = 80;
let alertFrequency = 5;

// Get settings value
ipcRenderer.on('settings:get', (e, settings) => {
    cpuOverload = +settings.cpuOverload;
    alertFrequency = +settings.alertFrequency;

    localStorage.removeItem('lastNotify');
});

// Run Every 2 secs
setInterval(() => {
    // cpu usage
    cpu.usage().then((info) => {
        document.getElementById('cpu-usage').innerText = `${info} %`;
        document.getElementById('cpu-progress').style.width = `${info}%`;

        // Progress bar
        if (info >= cpuOverload) {
            document.getElementById('cpu-progress').style.backgroundColor = 'red';
        } else {
            document.getElementById('cpu-progress').style.backgroundColor = '#30c88b';
        }

        // Notify
        if (info >= cpuOverload && runNotify(alertFrequency)) {
            new notifyUser({
                title: 'CPU Overload',
                body: `CPU is over ${cpuOverload}%`,
                icon: path.join(__dirname, 'img', 'icon.png')
            });

            localStorage.setItem('lastNotify', +new Date())
        }

        // Mem usage
        mem.info().then((info) => {
            var memUsage = (info.usedMemMb / info.totalMemMb) * 100;
            memUsage = Math.round(memUsage * 100) / 100;
            document.getElementById('mem-usage').innerText = `${memUsage} %`;
        });
    });

    // cpu free
    cpu.free().then((info) => {
        document.getElementById('cpu-free').innerText = `${info} %`;
    });

    // uptime
    document.getElementById('sys-uptime').innerText = seconds2Dhms(os.uptime());
}, 2000);

// set model
document.getElementById('cpu-model').innerText = cpu.model();

// set computer name
document.getElementById('comp-name').innerText = os.hostname();

// os
document.getElementById('os').innerText = `${os.type()} ${os.arch()}`;

// total mem
mem.info().then((info) => {
    document.getElementById('mem-total').innerText = `${info.totalMemMb / 1000} GB`;
    document.getElementById('mem-total_').innerText = `${info.totalMemMb / 1000} GB`;
});

// show days, hours, mins, secs
function seconds2Dhms(sec) {
    sec = +sec;
    const d = Math.floor(sec / (60 * 60 * 24));
    const h = Math.floor(sec % (60 * 60 * 24) / (60 * 60));
    const m = Math.floor(sec % (60 * 60) / 60);
    const s = Math.floor(sec % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

// send Notification
function notifyUser(options) {
    new Notification(options.title, options);
};

// check passed since last Notify
function runNotify(frequency) {
    if (localStorage.getItem('lastNotify') === null) {
        localStorage.setItem('lastNotify', +new Date());
        return true;
    }

    const notifyTime = new Date(+localStorage.getItem('lastNotify'));
    const now = new Date();
    const diffTime = Math.abs(now - notifyTime);
    const passedMin = Math.ceil(diffTime / (1000 * 60));

    if (passedMin > frequency) {
        return true;
    } else {
        return false;
    }
};