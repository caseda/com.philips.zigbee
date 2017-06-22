'use strict';

const ZigBeeDriver = require('homey-zigbeedriver');

module.exports = new ZigBeeDriver('dimmer_switch', {
    capabilities: {
      measure_battery: {
        command_endpoint: 1,
        command_cluster: 'genPowerCfg',
  			command_get: 'batteryPercentageRemaining',
  			command_report_parser: value => Math.round(value / 2),
      }
    }
});

module.exports.on('initNode', (token) => {
	const node = module.exports.nodes[token];

	if (node) {
    // Bind to the onoff part of the dimmer
    if (typeof node.instance.endpoints[0].genOnOff !== 'undefined') {
      node.instance.endpoints[0].genOnOff.bind((err) => {
        if (err) console.log('Something went wrong registering onoff bind', err);
      });
    }

    // Bind to the dimming part of the dimmer
    if (typeof node.instance.endpoints[0].genLevelCtrl !== 'undefined') {
  		node.instance.endpoints[0].genLevelCtrl.bind((err) => {
        if (err) console.log('Something went wrong registering dim bind', err);
      });
    }

    // Listen to all the commands that come in
    node.instance.on('command', report => {
      if (report && typeof report.command !== 'undefined') {
        // On command
        if (report.command === 'on' || report.command === 'onWithEffect') {
          Homey.manager('flow').triggerDevice('hue_dimmer_on', null, null, node.device_data);
        }

        // Off command
        if (report.command === 'off' || report.command === 'offWithEffect') {
          Homey.manager('flow').triggerDevice('hue_dimmer_off', null, null, node.device_data);
        }

        // Dim commands
        if (report.command === 'step') {
          // Short press
          if (report.stepsize === 30) {
            // Dim up
            if (report.stepmode === 0) Homey.manager('flow').triggerDevice('hue_dimmer_dim', null, { direction: 'press-up' }, node.device_data);
            //Dim down
            if (report.stepmode === 1) Homey.manager('flow').triggerDevice('hue_dimmer_dim', null, { direction: 'press-down' }, node.device_data);
          }

          // Long press
          if (report.stepsize === 56) {
            // Dim up
            if (report.stepmode === 0) Homey.manager('flow').triggerDevice('hue_dimmer_dim', null, { direction: 'hold-up' }, node.device_data);
            //Dim down
            if (report.stepmode === 1) Homey.manager('flow').triggerDevice('hue_dimmer_dim', null, { direction: 'hold-down' }, node.device_data);
          }
        }

        if (report.command === 'stop') Homey.manager('flow').triggerDevice('hue_dimmer_dim', null, { direction: 'hold-stop' }, node.device_data);
      }
    });
  }
});

Homey.manager('flow').on('trigger.hue_dimmer_dim', (callback, args, state) => {
  if (args && state && args.hasOwnProperty('direction') && state.hasOwnProperty('direction') && args.direction === state.direction) return callback(null, true);
  else return callback(null, false);
});
