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
import { UPSMonitor } from './upsmon.js';

async function main() {
    const nutHost = process.env.NUT_HOST;
    if (!nutHost) {
        console.log("Must define env var: NUT_HOST")
        return;
    }
    const nutPort = process.env.NUT_PORT;
    if (!nutPort) {
        console.log("Must define env var: NUT_PORT")
        return;
    }
    const loggingURL = process.env.LOGGING_URL;
    if (!loggingURL) {
        console.log("Must define env var: LOGGING_URL")
        return;
    }

    const monitor = new UPSMonitor({ nutHost, nutPort, loggingURL });
    await monitor.pollUPS();
}

main();
