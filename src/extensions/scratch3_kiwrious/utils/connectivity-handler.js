class ConnectivityHandler {

    constructor () {
        this._isRunning = false;
        this._isConnected = false;
        this._isFreezeEnabled = false;
        this._isHumiditySensorEnabled = false;
        this._isConductivitySensorEnabled = false;
        this._isUvSensorEnabled = false;
        this._isVocSensorEnabled = false;
    }

    setSensorTypeFlags (id) {
        switch (id) {
        case 1:
            this._isUvSensorEnabled = true;
            break;
        case 4:
            this._isConductivitySensorEnabled = true;
            break;
        case 6:
            this._isVocSensorEnabled = true;
            break;
        case 7:
            this._isHumiditySensorEnabled = true;
            break;
        }
    }

    set isRunning (flag) {
        this._isRunning = flag;
    }

    set isConnected (flag) {
        this._isConnected = flag;
    }

    set isFreezeEnabled (flag) {
        this._isFreezeEnabled = flag;
    }

    get isRunning () {
        return this._isRunning;
    }

    get isConnected () {
        return this._isConnected;
    }

    get isFreezeEnabled () {
        return this._isFreezeEnabled;
    }

    get isHumiditySensorEnabled () {
        return this._isHumiditySensorEnabled;
    }

    get isConductivitySensorEnabled () {
        return this._isConductivitySensorEnabled;
    }

    get isUvSensorEnabled () {
        return this._isUvSensorEnabled;
    }

    get isVocSensorEnabled () {
        return this._isVocSensorEnabled;
    }
}

module.exports = ConnectivityHandler;
