require('core-js/stable');
require('regenerator-runtime/runtime');

const BlockType = require('../../extension-support/block-type');

const Constants = require('./utils/constants');
const ConnectivityHandler = require('./utils/connectivity-handler');
const SensorDecoder = require('./utils/sensor-decoder');

class Scratch3Kiwrious {

    constructor (runtime) {
        this.connectivityHandler = new ConnectivityHandler();
        this.sensorDecoder = new SensorDecoder();

        this.runtime = runtime;

        this.runtime.on('PROJECT_STOP_ALL', () => {
            this.connectivityHandler.isRunning = false;
        });
        this._disconnectListener();

        this._port = null;
        this._sensorData = null;
    }

    getInfo () {
        return {
            id: Constants.EXTENSION_ID,
            name: Constants.EXTENSION_NAME,
            color1: Constants.KIWRIOUS_COLOUR,
            color2: Constants.KIWRIOUS_COLOUR,
            blockIconURI: Constants.BLOCK_ICON_URI,
            menuIconURI: Constants.MENU_ICON_URI,
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
            // eslint-disable-next-line no-alert
            alert("This feature only works on Chrome with 'Experimental Web Platform features' enabled");
            return;
        }

        if (!this.connectivityHandler.isConnected) {
            this._port = await navigator.serial.requestPort(Constants.FILTERS);
            await this._port.open({baudRate: 230400});

            this.connectivityHandler.isConnected = true;
        }
    }

    async Read () {
        if (!(this._port && this._port.readable)) {
            // eslint-disable-next-line no-alert
            alert('Sensor setup failed');
            return;
        }

        this.connectivityHandler.isRunning = true;
        const reader = this._port.readable.getReader();

        const rawData = await this._read(reader);
        this.connectivityHandler.setSensorTypeFlags(rawData[2]);

        try {
            while (this.connectivityHandler.isRunning) {
                const serialValue = await this._read(reader);
                if (serialValue.length === Constants.KIWRIOUS_RX_LENGTH) {
                    this._sensorData = new Uint8Array(serialValue);
                }
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Serial Read', e);
        }

        await reader.cancel();
    }

    'Humidity (%)' () {
        if (!(this._sensorData && this.connectivityHandler.isHumiditySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeHumidity(this._sensorData);
    }

    'Temperature (°C)' () {
        if (!(this._sensorData && this.connectivityHandler.isHumiditySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeTemperature(this._sensorData);
    }

    'Resistance (Ω)' () {
        if (!(this._sensorData && this.connectivityHandler.isConductivitySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeResistance(this._sensorData);
    }

    'Conductance (μS)' () {
        if (!(this._sensorData && this.connectivityHandler.isConductivitySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.calculateConductance(this['Resistance (Ω)']());
    }

    Lux () {
        if (!(this._sensorData && this.connectivityHandler.isUvSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeLux(this._sensorData);
    }

    UV () {
        if (!(this._sensorData && this.connectivityHandler.isUvSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeUV(this._sensorData);
    }

    'tVOC (ppb)' () {
        if (!(this._sensorData && this.connectivityHandler.isVocSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeVOC(this._sensorData);
    }

    'CO2eq (ppm)' () {
        if (!(this._sensorData && this.connectivityHandler.isVocSensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.decodeCO2(this._sensorData);
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
