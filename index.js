const dgram = require('dgram');

const COMMAND_TAKE_OFF = 0x01;
const COMMAND_CALIBRATE_GYRO = 0x80;
const COMMAND_UNLOCK_MOTOR = 0x40;

function debug(msg) {
    if (process.env.DRONELIB_DEBUG) console.log(`[dronelib] ${msg}`);
}

class Drone {
    /**
     * @constructor
     * @class Drone
     * @description Control your lewei-based drone from Node.js
     * @returns {Drone}
     */
    constructor() {
        this.enabled = false;
        this.sendInterval = null;
        this.socket = dgram.createSocket("udp4");

        this.throttle = 128;
        this.turn = 128;
        this.forwardBackward = 128;
        this.leftRight = 128;
        this.currentCommand = 0;
    }

    /**
     * @function enable
     * @description Start sending commands to drone
     */
    enable() {
        this.enabled = true;
        this.sendInterval = setInterval(() => { this._sendMessage() }, 50);
    }

    /**
     * @function disable
     * @description Stop sending commands to drone
     */
    disable() {
        this.enabled = false;
        clearInterval(this.sendInterval);
        this.sendInterval = null;
    }

    /**
     * @function _buildMessage
     * @description Create message bytes to send to drone
     * @returns {Buffer} Message bytes to send to drone
     * @private
     */
    _buildMessage() {
        var message = [0x66];

        if (this.currentCommand === 0) {
            message.push(this.leftRight);
            message.push(this.forwardBackward);
            message.push(this.throttle);
            message.push(this.turn);
            message.push(0);
            message.push(this.leftRight ^ this.forwardBackward ^ this.throttle ^ this.turn);
        } else {
            message.push(0x80);
            message.push(0x80);
            message.push(0x80);
            message.push(0x80);
            message.push(this.currentCommand);
            message.push(this.currentCommand);
        }

        message.push(0x99);

        return Buffer.from(message);
    }

    /**
     * @function _sendMessage
     * @description Send message bytes to drone
     * @private
     */
    _sendMessage() {
        this.socket.send(this._buildMessage(), 50000, "192.168.0.1")
    }

    /**
     * @function _sendCommand
     * @description Send number-based command
     * @param {Number} cmd Command to send
     * @private
     */
    _sendCommand(cmd) {
        // Send the command for 1 second-ish
        if (this.currentCommand === 0) {
            this.currentCommand = cmd;
            setTimeout(() => {
                this.currentCommand = 0;
            }, 500);
        }
    }

    /**
     * @function takeOff
     * @description Begin flight.
     */
    takeOff() {
        this._sendCommand(COMMAND_TAKE_OFF)
    }

    /**
     * @function land
     * @description Land drone.
     */
    land() {
        this._sendCommand(COMMAND_TAKE_OFF)
    }

    /**
     * @function calibrateGyro
     * @description Calibrate gyrometer on drone.
     */
    calibrateGyro() {
        this._sendCommand(COMMAND_CALIBRATE_GYRO)
    }

    /**
     * @function toggleMotorLock
     * @description Toggle motor lock on drone.
     */
    toggleMotorLock() {
        this._sendCommand(COMMAND_UNLOCK_MOTOR)
    }
}

module.exports = { Drone };