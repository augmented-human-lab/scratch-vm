class ConnectivityHandler {

    constructor () {
        this._isRunning = false;
        this._isConnected = false;
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

    setIsRunning (flag) {
        this._isRunning = flag;
    }

    setIsConnected (flag) {
        this._isConnected = flag;
    }

    getIsRunning () {
        return this._isRunning;
    }

    getIsConnected () {
        return this._isConnected;
    }

    getIsHumiditySensorEnabled () {
        return this._isHumiditySensorEnabled;
    }

    getIsConductivitySensorEnabled () {
        return this._isConductivitySensorEnabled;
    }

    getIsUvSensorEnabled () {
        return this._isUvSensorEnabled;
    }

    getIsVocSensorEnabled () {
        return this._isVocSensorEnabled;
    }
}

module.exports = ConnectivityHandler;
