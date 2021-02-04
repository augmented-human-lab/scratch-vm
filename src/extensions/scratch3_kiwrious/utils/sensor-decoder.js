class SensorDecoder {

    constructor () {
        this._holdHumidity = false;
        this._holdTemperature = false;
        this._holdResistance = false;
        this._holdConductance = false;
        this._holdLux = false;
        this._holdUV = false;
        this._holdVOC = false;
        this._holdCO2 = false;
    }

    decodeHumidity (sensorData, isFreeze) {
        if (isFreeze && !this._holdHumidity) {
            this._holdHumidity = true;
        } else if (isFreeze && this._holdHumidity) return;

        if (!isFreeze) this._holdHumidity = false;

        const humidity = sensorData[8] | (sensorData[9] << 8);
        return humidity / 100;
    }

    decodeTemperature (sensorData, isFreeze) {
        if (isFreeze && !this._holdTemperature) {
            this._holdTemperature = true;
        } else if (isFreeze && this._holdTemperature) return;

        if (!isFreeze) this._holdTemperature = false;

        const temperature = sensorData[6] | (sensorData[7] << 8);
        return temperature / 100;
    }

    decodeResistance (sensorData, isFreeze) {
        if (isFreeze && !this._holdResistance) {
            this._holdResistance = true;
        } else if (isFreeze && this._holdResistance) return;

        if (!isFreeze) this._holdResistance = false;

        return (sensorData[6] | (sensorData[7] << 8)) * (sensorData[8] | (sensorData[9] << 8));
    }

    calculateConductance (resistance, isFreeze) {
        if (isFreeze && !this._holdConductance) {
            this._holdConductance = true;
        } else if (isFreeze && this._holdConductance) return;

        if (!isFreeze) this._holdConductance = false;

        if (resistance === 0) {
            return 0;
        }
        const conductivity = (1 / resistance) * 1000000;
        return conductivity.toFixed(2);
    }

    decodeLux (sensorData, isFreeze) {

        if (isFreeze && !this._holdLux) {
            this._holdLux = true;
        } else if (isFreeze && this._holdLux) return;

        if (!isFreeze) this._holdLux = false;

        const lux = new DataView(sensorData.buffer);
        return lux.getFloat32(6, true).toFixed(0);
    }

    decodeUV (sensorData, isFreeze) {

        if (isFreeze && !this._holdUV) {
            this._holdUV = true;
        } else if (isFreeze && this._holdUV) return;

        if (!isFreeze) this._holdUV = false;

        const uv = new DataView(sensorData.buffer);
        return uv.getFloat32(10, true).toFixed(1);
    }

    decodeVOC (sensorData, isFreeze) {
        if (isFreeze && !this._holdVOC) {
            this._holdVOC = true;
        } else if (isFreeze && this._holdVOC) return;

        if (!isFreeze) this._holdVOC = false;

        return sensorData[6] | (sensorData[7] << 8);
    }

    decodeCO2 (sensorData, isFreeze) {
        if (isFreeze && !this._holdCO2) {
            this._holdCO2 = true;
        } else if (isFreeze && this._holdCO2) return;

        if (!isFreeze) this._holdCO2 = false;

        return sensorData[8] | (sensorData[9] << 8);
    }
}

module.exports = SensorDecoder;
