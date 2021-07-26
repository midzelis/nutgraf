/*
 The MIT License (MIT)

Copyright (c) 2021 Min Idzelis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 
*/
import { Nut } from './node-nut.mjs';
import fetch from 'node-fetch';

function isFloat(val) {
    let floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(val)) return false;

    val = parseFloat(val);
    if (isNaN(val)) return false;
    return true;
}

function isInt(val) {
    const intRegex = /^-?\d+$/;
    if (!intRegex.test(val)) return false;

    const intVal = parseInt(val, 10);
    return parseFloat(val) == intVal && !isNaN(intVal);
}

export class UPSMonitor {
    nut;
    loggingURL;
    quiet;
    nutPort;
    nutHost;

    constructor({ nutHost, nutPort, loggingURL, quiet }) {
        this.nut = new Nut(nutPort, nutHost);
        this.nutPort = nutPort;
        this.nutHost = nutHost;
        this.loggingURL = loggingURL;
        this.quiet = quiet;
        const { nut } = this;
        nut.on('error', function (err) {
            console.error('There was an error: ' + err);
        });

        nut.on('close', function () {
            this.log('Connection closed.');
        });
    }

    sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    async connect() {
        return new Promise((resolve) => {
            this.nut.on('ready', resolve.bind(this, this.nut));
            this.nut.start();
        });
    }

    async pollUPS(nut) {
        await this.connect();
        this.log(`Connected to Network UPS Tools (NUT) Server at ${this.nutHost}:${this.nutPort}`);

        for (;;) {
            await this.poll();
            await this.sleep(30000);
        }
    }

    async poll() {
        this.log('Polling...');

        try {
            const { nut } = this;
            const upses = await nut.GetUPSList();

            const metrics = [];
            for (const upsname of Object.keys(upses)) {
                const vars = await nut.GetUPSVars(upsname);
                for (const key of Object.keys(vars)) {
                    const value = vars[key];
                    if (isInt(value)) {
                        vars[key] = +value;
                    } else if (isFloat(value)) {
                        vars[key] = parseFloat(value);
                    }
                }
                vars['nutgraf.ups.name'] = upsname;
                vars['nutgraf.measurement.name'] = 'nutgraf_ups_data';

                const current = vars['output.current'];
                const voltage = vars['output.voltage'];
                if (typeof current === 'number' && typeof voltage === 'number') {
                    vars['nutgraf.ups.realpower'] = current * voltage;
                }

                const maxwatts = process.env[`NUTGRAF_MAX_WATTS_${upsname}`];
                const load = vars['ups.load'];
                if (isInt(maxwatts) && typeof load === 'number') {
                    vars['nutgraf.ups.realpower'] = this.round((load / 100.0) * maxwatts, 2);
                }
                metrics.push(vars);
            }

            try {
                this.log(metrics);
                await fetch(this.loggingURL, {
                    method: 'post',
                    body: JSON.stringify(metrics),
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (e) {
                //ignore
                console.error(e);
            }
        } catch (err) {
            if (err.message === 'DATA-STALE') {
                return;
            }
            this.log(err.message);
        }
    }
    log() {
        if (!this.quiet) {
            console.log(...arguments);
        }
    }
}
