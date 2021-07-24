import { Nut } from 'node-nut/nut';
import fetch from 'node-fetch';

function isFloat(val) {
    let floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(val))
        return false;

    val = parseFloat(val);
    if (isNaN(val))
        return false;
    return true;
}

function isInt(val) {
    const intRegex = /^-?\d+$/;
    if (!intRegex.test(val))
        return false;

    const intVal = parseInt(val, 10);
    return parseFloat(val) == intVal && !isNaN(intVal);
}

export class UPSMonitor {
    nut;
    loggingURL;

    constructor({nutHost, nutPort, loggingURL}) {
        this.nut = new Nut(nutPort, nutHost);
        this.loggingURL=loggingURL;
        const { nut } = this;
        nut.on('error', function (err) {
            console.log('There was an error: ' + err);
        });

        nut.on('close', function () {
            console.log('Connection closed.');
        });
    }

    async connect() {
        return new Promise((resolve) => {
            this.nut.on('ready', resolve.bind(this, this.nut));
            this.nut.start();
        });
    }

    async pollUPS(nut) {
        await this.connect();
        console.log('Connected to NUT');

        const timeout = (time) => new Promise((resolve) => setTimeout(resolve, time));

        for (; ;) {
            await this.checkUPS();
            await timeout(30000);
        }
    }

    async checkUPS() {
        console.log('Polling...');

        try {
            const { nut } = this;
            const upses = await nut.GetUPSList();

            const metrics = [];
            for (const ups of Object.keys(upses)) {
                const vars = await nut.GetUPSVars(ups);
                for (const key of Object.keys(vars)) {
                    const value = vars[key];
                    if (isInt(value)) {
                        vars[key] = +value;
                    } else if (isFloat(value)) {
                        vars[key] = parseFloat(value);
                    }
                }
                vars.UPS_NAME = ups;
                metrics.push(vars);
            }

            try {
                console.log(metrics);
                await fetch(this.loggingURL, {
                    method: 'post',
                    body: JSON.stringify(metrics),
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (e) {
                //ignore
                console.log(e)
            }
        } catch (err) {
            if (err.message === 'DATA-STALE') {
                return;
            }
            console.log(err.message);
        }
    }
}
