require('core-js/stable');
require('regenerator-runtime/runtime');

const BlockType = require('../../extension-support/block-type');

const KIWRIOUS_RX_LENGTH = 26;
const filters = [
    {usbVendorId: 0x04d8, usbProductId: 0xec19}
];

let isRunning = false;
let isConnected = false;

let isHumiditySensorEnabled = false;

let port;
let sensorData;

class Scratch3Kiwrious {
    constructor (runtime) {
        this.runtime = runtime;

        this.runtime.on('PROJECT_STOP_ALL', () => {
            isRunning = false;
        });
        this._disconnectListener();
    }

    getInfo () {
        return {
            id: 'kiwrious',
            name: 'Kiwrious',
            blocks: [
                {
                    opcode: 'Connect',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'Read',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'Humidity',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'Temperature',
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
            }
        };
    }

    async Connect () {
        if (!('serial' in navigator)) {
            alert("This feature only works on Chrome with 'Experimental Web Platform features' enabled");
            return;
        }

        if (!isConnected) {
            port = await navigator.serial.requestPort({filters});
            await port.open({baudRate: 230400});

            isConnected = true;
        }
    }

    async Read () {
        if (!(port && port.readable)) {
            alert('Sensor setup failed');
            return;
        }

        isRunning = true;
        const reader = port.readable.getReader();

        const rawData = await this._read(reader);
        this._setSensorTypeFlags(rawData[2]);

        try {
            while (isRunning) {
                const serialValue = await this._read(reader);
                if (serialValue.length === KIWRIOUS_RX_LENGTH) {
                    sensorData = new Uint8Array(serialValue);
                }
            }
        } catch (e) {
            console.warn('Serial Read', e);
        }

        await reader.cancel();
    }

    Humidity () {
        if (!(sensorData && isHumiditySensorEnabled)) {
            return 0;
        }
        const humidity = sensorData[8] | (sensorData[9] << 8);
        return humidity / 100;
    }

    Temperature () {
        if (!(sensorData && isHumiditySensorEnabled)) {
            return 0;
        }
        const temperature = sensorData[6] | (sensorData[7] << 8);
        return temperature / 100;
    }

    _read (reader) {
        const serialPacket = async function (resolve) {
            const {value, done} = await reader.read();
            if (done) {
                reader.releaseLock();
                throw new Error('Read Terminated');
            }
            resolve(value);
        };

        return new Promise(serialPacket);
    }

    _disconnectListener () {
        if ('serial' in navigator) {
            navigator.serial.addEventListener('disconnect', () => {
                isConnected = false;
                isRunning = false;
                isHumiditySensorEnabled = false;
            });
        }
    }

    _setSensorTypeFlags (id) {
        switch (id) {
        case 7:
            isHumiditySensorEnabled = true;
            break;
        }
    }
}

module.exports = Scratch3Kiwrious;
