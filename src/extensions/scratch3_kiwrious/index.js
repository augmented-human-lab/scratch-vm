require('core-js/stable');
require('regenerator-runtime/runtime');

const BlockType = require('../../extension-support/block-type');

const Constants = require('./utils/constants');
const filters = Constants.filters;

let isRunning = false;
let isConnected = false;

let isHumiditySensorEnabled = false;
let isConductivitySensorEnabled = false;
let isUvSensorEnabled = false;
let isVocSensorEnabled = false;

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
            id: Constants.EXTENSION_ID,
            name: Constants.EXTENSION_NAME,
            color1: Constants.KIWRIOUS_COLOUR,
            color2: Constants.KIWRIOUS_COLOUR,
            blockIconURI: Constants.blockIconURI,
            menuIconURI: Constants.menuIconURI,
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
                    opcode: 'Humidity (%)',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'Temperature (°C)',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'Resistance (Ω)',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'Conductance (μS)',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'Lux',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'UV',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'tVOC (ppb)',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'CO2eq (ppm)',
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
                if (serialValue.length === Constants.KIWRIOUS_RX_LENGTH) {
                    sensorData = new Uint8Array(serialValue);
                }
            }
        } catch (e) {
            console.warn('Serial Read', e);
        }

        await reader.cancel();
    }

    'Humidity (%)' () {
        if (!(sensorData && isHumiditySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        const humidity = sensorData[8] | (sensorData[9] << 8);
        return humidity / 100;
    }

    'Temperature (°C)' () {
        if (!(sensorData && isHumiditySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        const temperature = sensorData[6] | (sensorData[7] << 8);
        return temperature / 100;
    }

    'Resistance (Ω)' () {
        if (!(sensorData && isConductivitySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return (sensorData[6] | (sensorData[7] << 8)) * (sensorData[8] | (sensorData[9] << 8));
    }

    'Conductance (μS)' () {
        if (!(sensorData && isConductivitySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        const resistance = this['Resistance (Ω)']();
        if (resistance === 0) {
            return 0;
        }
        const conductivity = (1 / resistance) * 1000000;
        return conductivity.toFixed(2);
    }

    Lux () {
        if (!(sensorData && isUvSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        const lux = new DataView(sensorData.buffer);
        return lux.getFloat32(6, true).toFixed(0);
    }

    UV () {
        if (!(sensorData && isUvSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        const uv = new DataView(sensorData.buffer);
        return uv.getFloat32(10, true).toFixed(1);
    }

    'tVOC (ppb)' () {
        if (!(sensorData && isVocSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return sensorData[6] | (sensorData[7] << 8);
    }

    'CO2eq (ppm)' () {
        if (!(sensorData && isVocSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return sensorData[8] | (sensorData[9] << 8);
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
                isConductivitySensorEnabled = false;
                isUvSensorEnabled = false;
                isVocSensorEnabled = false;
            });
        }
    }

    _setSensorTypeFlags (id) {
        switch (id) {
        case 1:
            isUvSensorEnabled = true;
            break;
        case 4:
            isConductivitySensorEnabled = true;
            break;
        case 6:
            isVocSensorEnabled = true;
            break;
        case 7:
            isHumiditySensorEnabled = true;
            break;
        }
    }
}

module.exports = Scratch3Kiwrious;
