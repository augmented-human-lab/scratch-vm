const Constants = require('./constants');

const PACKET_HEADER_BYTE = 0x0a;
const PACKET_FOOTER_BYTE = 0x0b;
const MAX_RETRY_TIME = 128;

class SerialReader {

    constructor (reader) {
        this._reader = reader;
        this._array = new Uint8Array();
    }

    async _readDataToBuffer () {

        const readInstance = await this._reader.read();
        const {value, done} = readInstance;

        if (done) {
            throw new Error('reader disconnected.');
        }
        this._array = SerialReader.concatArray(this._array, value);
    }

    async _locateHeader () {

        let retryTime = 0;
        /* Try to locate header bytes using loop */

        while (retryTime < MAX_RETRY_TIME) {
            /* We need at least two bytes to locate the header */
            if (this._array.length >= 2) {
                for (let i = 0; i < this._array.length - 1; i++) {
                    if (this._array[i] === PACKET_HEADER_BYTE && this._array[i + 1] === PACKET_HEADER_BYTE) {
                        /* Found the header, dump the bytes before header */
                        this._array = this._array.subarray(i);
                        return;
                    }
                }
            }
            /* Header not found yet */
            retryTime++;
            await this._readDataToBuffer();
        }
        throw new Error('Unable to locate packet header');
    }

    async readOnce () {

        let retryTime = 0;
        while (retryTime < MAX_RETRY_TIME) {
            await this._locateHeader();

            /* Read a complete packet */
            while (this._array.length < Constants.KIWRIOUS_RX_LENGTH) {
                await this._readDataToBuffer();
            }

            /* Validate Footer */
            if (this._array[Constants.KIWRIOUS_RX_LENGTH - 2] === PACKET_FOOTER_BYTE &&
                this._array[Constants.KIWRIOUS_RX_LENGTH - 1] === PACKET_FOOTER_BYTE) {
                /* Extract the packet from buffer */
                const value = this._array.subarray(0, Constants.KIWRIOUS_RX_LENGTH);
                this._array = this._array.subarray(Constants.KIWRIOUS_RX_LENGTH);
                return value;
            }

            /* footer validation failed, we dump the header we found and restart the loop */
            this._array = this._array.subarray(2);
            retryTime++;
        }

        throw new Error('Failed to extract a packet due to protocol error');
    }

    static concatArray (a, b) {
        const c = new Uint8Array(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);

        return c;
    }

}

module.exports = SerialReader;
