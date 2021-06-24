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

        this._humidity = null;
        this._temperature = null;
        this._resistance = null;
        this._conductance = null;
        this._lux = null;
        this._uv = null;
        this._voc = null;
        this._co2 = null;
    }

    decodeHumidity (sensorData, isFreeze) {
        if (isFreeze && !this._holdHumidity) {
            this._holdHumidity = true;
        } else if (isFreeze && this._holdHumidity) return this._humidity;

        if (!isFreeze) this._holdHumidity = false;

        const humidity = sensorData[8] | (sensorData[9] << 8);
        this._humidity = humidity / 100;
        return this._humidity;
    }

    decodeTemperature (sensorData, isFreeze) {
        if (isFreeze && !this._holdTemperature) {
            this._holdTemperature = true;
        } else if (isFreeze && this._holdTemperature) return this._temperature;

        if (!isFreeze) this._holdTemperature = false;

        const temperature = sensorData[6] | (sensorData[7] << 8);
        this._temperature = temperature / 100;
        return this._temperature;
    }

    decodeResistance (sensorData, isFreeze) {
        if (isFreeze && !this._holdResistance) {
            this._holdResistance = true;
        } else if (isFreeze && this._holdResistance) return this._resistance;

        if (!isFreeze) this._holdResistance = false;

        this._resistance = (sensorData[6] | (sensorData[7] << 8)) * (sensorData[8] | (sensorData[9] << 8));
        return this._resistance;
    }

    calculateConductance (resistance, isFreeze) {
        if (isFreeze && !this._holdConductance) {
            this._holdConductance = true;
        } else if (isFreeze && this._holdConductance) return this._conductance;

        if (!isFreeze) this._holdConductance = false;

        if (resistance === 0) {
            this._conductance = 0;
            return this._conductance;
        }
        this._conductance = ((1 / resistance) * 1000000).toFixed(2);
        return this._conductance;
    }

    decodeLux (sensorData, isFreeze) {

        if (isFreeze && !this._holdLux) {
            this._holdLux = true;
        } else if (isFreeze && this._holdLux) return this._lux;

        if (!isFreeze) this._holdLux = false;

        const lux = new DataView(sensorData.buffer);
        this._lux = lux.getFloat32(6, true).toFixed(0);
        return this._lux;
    }

    decodeUV (sensorData, isFreeze) {

        if (isFreeze && !this._holdUV) {
            this._holdUV = true;
        } else if (isFreeze && this._holdUV) return this._uv;

        if (!isFreeze) this._holdUV = false;

        const uv = new DataView(sensorData.buffer);
        this._uv = uv.getFloat32(10, true).toFixed(1);
        return this._uv;
    }

    decodeVOC (sensorData, isFreeze) {
        if (isFreeze && !this._holdVOC) {
            this._holdVOC = true;
        } else if (isFreeze && this._holdVOC) return this._voc;

        if (!isFreeze) this._holdVOC = false;

        this._voc = sensorData[6] | (sensorData[7] << 8);
        return this._voc;
    }

    decodeCO2 (sensorData, isFreeze) {
        if (isFreeze && !this._holdCO2) {
            this._holdCO2 = true;
        } else if (isFreeze && this._holdCO2) return this._co2;

        if (!isFreeze) this._holdCO2 = false;

        this._co2 = sensorData[8] | (sensorData[9] << 8);
        return this._co2;
    }
}

module.exports = SensorDecoder;
