'use strict';

var utils = require('./nikobus/utils');

function NikobusAccessorySwitchModuleOutput(log, platform, name, switchModule, switchModuleOutputNumber, serviceType)
{
	this.log = log;
	this.log('NikobusAccessorySwitchModuleOutput() enter', 5);
	this.log('name = ' + name + ', ' + 'type = ' + serviceType + ', ' + 'switch module = ' + utils.intToHex(switchModule.address, 4) + ', ' + 'output = ' + switchModuleOutputNumber, 7);
	this.platform = platform;
	this.name = name;
	this.switchModule = switchModule;
	this.switchModuleOutputNumber = switchModuleOutputNumber;
	this.serviceType = serviceType;
	this.log('NikobusAccessorySwitchModuleOutput() leave', 9);
}

NikobusAccessorySwitchModuleOutput.prototype.mylog = function(text, level)
{
	this.log('[' + this.name + '] ' + text, level);
}

NikobusAccessorySwitchModuleOutput.prototype.setPowerState = function(value)
{
	this.mylog('NikobusAccessorySwitchModuleOutput.setPowerState() enter', 5);
	this.log('value = ' + value, 7);
	return new Promise(function(resolve, reject)
	{
		this.platform.nikobus.queue.push(this.name + ' setPowerState ' + value, {},
			function(args, callback)
			{
				this.switchModule.setOutputState(this.switchModuleOutputNumber, (value ? 'FF' : '00'), 2500,
					function(err)
					{
						this.log('NikobusModuleSwitch.setOutputState() callback (err = ' + err + ')', err ? 1 : 8);
						callback(err);
						if (err)
						{
							reject(err);
						}
						else
						{
							resolve();
						}
					}.bind(this)
				);
			}.bind(this)
		);
	}.bind(this)).finally(function()
	{
		this.mylog('NikobusAccessorySwitchModuleOutput.setPowerState() leave', 9);
	}.bind(this));
}

NikobusAccessorySwitchModuleOutput.prototype.getPowerState = function()
{
	this.mylog('NikobusAccessorySwitchModuleOutput.getPowerState() enter', 5);
	return new Promise(function(resolve, reject)
	{
		this.platform.nikobus.queue.push(this.name + ' getPowerState', {},
			function(args, callback)
			{
				this.switchModule.getOutputState(this.switchModuleOutputNumber, 2500,
					function(err, answer)
					{
						this.log('NikobusModuleSwitch.getOutputState() callback (err = ' + err + ', answer = ' + answer + ')', err ? 1 : 8);
						callback(err);
						if (err)
						{
							reject(err);
							return;
						}
						var value = (answer != '00');
						this.log('value = ' + value, 7);
						resolve(value);
					}.bind(this)
				);
			}.bind(this)
		);
	}.bind(this)).finally(function()
	{
		this.mylog('NikobusAccessorySwitchModuleOutput.getPowerState() leave', 9);
	}.bind(this));
}

NikobusAccessorySwitchModuleOutput.prototype.getServices = function()
{
	this.mylog('NikobusAccessorySwitchModuleOutput.getServices() enter', 5);
	var services = [];

	var Service = this.platform.api.hap.Service;
	var Characteristic = this.platform.api.hap.Characteristic;

	var service = new Service.AccessoryInformation();
	service.setCharacteristic(Characteristic.Manufacturer, 'Niko');
	service.setCharacteristic(Characteristic.Model, this.switchModule.model);
	service.setCharacteristic(Characteristic.SerialNumber, utils.intToHex(this.switchModule.address, 4) + '-' + utils.intToDec(this.switchModuleOutputNumber, 2));
	services.push(service);

	switch (this.serviceType)
	{
		case 'switch':
		{
			var switchService = new Service.Switch(this.name);
			switchService.getCharacteristic(Characteristic.On)
				.onGet(this.getPowerState.bind(this))
				.onSet(this.setPowerState.bind(this));
			services.push(switchService);
		}
		break;
		case 'lightbulb':
		{
			var lightService = new Service.Lightbulb(this.name);
			lightService.getCharacteristic(Characteristic.On)
				.onGet(this.getPowerState.bind(this))
				.onSet(this.setPowerState.bind(this));
			services.push(lightService);
		}
		break;
	}

	this.mylog('NikobusAccessorySwitchModuleOutput.getServices() leave', 9);
	return services;
}

module.exports =
{
	NikobusAccessorySwitchModuleOutput
}
