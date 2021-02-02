class SensorDecoder {

    decodeHumidity (sensorData) {
        const humidity = sensorData[8] | (sensorData[9] << 8);
        return humidity / 100;
    }

    decodeTemperature (sensorData) {
        const temperature = sensorData[6] | (sensorData[7] << 8);
        return temperature / 100;
    }

    decodeResistance (sensorData) {
        return (sensorData[6] | (sensorData[7] << 8)) * (sensorData[8] | (sensorData[9] << 8));
    }

    calculateConductance (resistance) {
        if (resistance === 0) {
            return 0;
        }
        const conductivity = (1 / resistance) * 1000000;
        return conductivity.toFixed(2);
    }

    decodeLux (sensorData) {
        const lux = new DataView(sensorData.buffer);
        return lux.getFloat32(6, true).toFixed(0);
    }

    decodeUV (sensorData) {
        const uv = new DataView(sensorData.buffer);
        return uv.getFloat32(10, true).toFixed(1);
    }

    decodeVOC (sensorData) {
        return sensorData[6] | (sensorData[7] << 8);
    }

    decodeCO2 (sensorData) {
        return sensorData[8] | (sensorData[9] << 8);
    }
}

module.exports = SensorDecoder;
