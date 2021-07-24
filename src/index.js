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
