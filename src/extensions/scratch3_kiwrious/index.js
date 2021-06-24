require('core-js/stable');
require('regenerator-runtime/runtime');

const BlockType = require('../../extension-support/block-type');

const Constants = require('./utils/constants');
const ConnectivityHandler = require('./utils/connectivity-handler');
const SerialReader = require('./utils/serial-reader');
const SensorDecoder = require('./utils/sensor-decoder');

class Scratch3Kiwrious {

    constructor (runtime) {
        this.connectivityHandler = new ConnectivityHandler();
        this.sensorDecoder = new SensorDecoder();

        this.runtime = runtime;

        this.runtime.on('PROJECT_STOP_ALL', () => {
            this.connectivityHandler.isRunning = false;
            this.connectivityHandler.isFreezeEnabled = false;
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
                    opcode: 'Read Forever',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'Freeze Reading',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'Unfreeze Reading',
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
            await this._port.open({baudRate: 115200});

            this.connectivityHandler.isConnected = true;
        }
    }

    async 'Read Forever' () {
        if (!(this._port && this._port.readable)) {
            // eslint-disable-next-line no-alert
            alert('Sensor setup failed');
            return;
        }

        this.connectivityHandler.isRunning = true;
        const reader = this._port.readable.getReader();
        const serialReader = new SerialReader(reader);

        const rawData = await serialReader.readOnce();
        this.connectivityHandler.setSensorTypeFlags(rawData[2]);

        try {
            while (this.connectivityHandler.isRunning) {
                const serialValue = await serialReader.readOnce();
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

    'Freeze Reading' () {
        if (this.connectivityHandler.isRunning) {
            this.connectivityHandler.isFreezeEnabled = true;
        } else {
            alert('Start Reading to Hold');
        }
    }

    'Unfreeze Reading' () {
        if (this.connectivityHandler.isRunning) {
            this.connectivityHandler.isFreezeEnabled = false;
        }
    }

    'Humidity (%)' () {
        return this._dataHandler(this.connectivityHandler.isHumiditySensorEnabled,
            this.sensorDecoder.decodeHumidity);
    }

    'Temperature (°C)' () {
        return this._dataHandler(this.connectivityHandler.isHumiditySensorEnabled,
            this.sensorDecoder.decodeTemperature);
    }

    'Resistance (Ω)' () {
        return this._dataHandler(this.connectivityHandler.isConductivitySensorEnabled,
            this.sensorDecoder.decodeResistance);
    }

    'Conductance (μS)' () {
        if (!(this._sensorData && this.connectivityHandler.isConductivitySensorEnabled)) {
            return Constants.NOT_CONNECTED;
        }
        return this.sensorDecoder.calculateConductance(this['Resistance (Ω)'](),
            this.connectivityHandler.isFreezeEnabled);
    }

    Lux () {
        return this._dataHandler(this.connectivityHandler.isUvSensorEnabled, this.sensorDecoder.decodeLux);
    }

    UV () {
        return this._dataHandler(this.connectivityHandler.isUvSensorEnabled, this.sensorDecoder.decodeUV);
    }

    'tVOC (ppb)' () {
        return this._dataHandler(this.connectivityHandler.isVocSensorEnabled, this.sensorDecoder.decodeVOC);
    }

    'CO2eq (ppm)' () {
        return this._dataHandler(this.connectivityHandler.isVocSensorEnabled, this.sensorDecoder.decodeCO2);
    }

    _dataHandler (isSensorConnected, decode) {
        if (!(this._sensorData && isSensorConnected)) {
            return Constants.NOT_CONNECTED;
        }
        return decode(this._sensorData, this.connectivityHandler.isFreezeEnabled);
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
