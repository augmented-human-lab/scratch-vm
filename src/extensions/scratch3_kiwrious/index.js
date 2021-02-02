require('core-js/stable');
require('regenerator-runtime/runtime');

const BlockType = require('../../extension-support/block-type');

const ConnectivityHandler = require('./utils/connectivity-handler');

const SensorDecoder = require('./utils/sensor-decoder');
const sensorDecoder = new SensorDecoder();

const Constants = require('./utils/constants');
const filters = Constants.filters;

let port;
let sensorData;

class Scratch3Kiwrious {
    constructor (runtime) {
        this.connectivityHandler = new ConnectivityHandler();
        this.runtime = runtime;

        this.runtime.on('PROJECT_STOP_ALL', () => {
            this.connectivityHandler.setIsRunning(false);
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

        if (!this.connectivityHandler.getIsConnected()) {
            port = await navigator.serial.requestPort({filters});
            await port.open({baudRate: 230400});

            this.connectivityHandler.setIsConnected(true);
        }
    }

    async Read () {
        if (!(port && port.readable)) {
            alert('Sensor setup failed');
            return;
        }

        this.connectivityHandler.setIsRunning(true);
        const reader = port.readable.getReader();

        const rawData = await this._read(reader);
        this.connectivityHandler.setSensorTypeFlags(rawData[2]);

        try {
            while (this.connectivityHandler.getIsRunning()) {
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
        if (!(sensorData && this.connectivityHandler.getIsHumiditySensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeHumidity(sensorData);
    }

    'Temperature (°C)' () {
        if (!(sensorData && this.connectivityHandler.getIsHumiditySensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeTemperature(sensorData);
    }

    'Resistance (Ω)' () {
        if (!(sensorData && this.connectivityHandler.getIsConductivitySensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeResistance(sensorData);
    }

    'Conductance (μS)' () {
        if (!(sensorData && this.connectivityHandler.getIsConductivitySensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.calculateConductance(this['Resistance (Ω)']());
    }

    Lux () {
        if (!(sensorData && this.connectivityHandler.getIsUvSensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeLux(sensorData);
    }

    UV () {
        if (!(sensorData && this.connectivityHandler.getIsUvSensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeUV(sensorData);
    }

    'tVOC (ppb)' () {
        if (!(sensorData && this.connectivityHandler.getIsVocSensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeVOC(sensorData);
    }

    'CO2eq (ppm)' () {
        if (!(sensorData && this.connectivityHandler.getIsVocSensorEnabled())) {
            return Constants.NOT_CONNECTED;
        }
        return sensorDecoder.decodeCO2(sensorData);
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
                this.connectivityHandler = new ConnectivityHandler();
            });
        }
    }
}

module.exports = Scratch3Kiwrious;
