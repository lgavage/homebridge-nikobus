'use strict';

var utils = require('./nikobus/utils');

function NikobusAccessoryPushbuttonModuleButton(log, platform, name, pushbutton, pushbuttonArea, serviceType)
{
	this.log = log;
	this.log('NikobusAccessoryPushbuttonModuleButton() enter', 5);
	this.log('name = ' + name + ', ' + 'pushbutton module = ' + utils.intToHex(pushbutton.address, 6) + ', ' + 'button = ' + pushbuttonArea, 7);
	this.platform = platform;
	this.name = name;
	this.pushbutton = pushbutton;
	this.pushbuttonArea = pushbuttonArea;
	this.serviceType = serviceType;
	this.state = false;
	this._onCharacteristic = null;
	this.log('NikobusAccessoryPushbuttonModuleButton() leave', 9);
}

NikobusAccessoryPushbuttonModuleButton.prototype.mylog = function(text, level)
{
	this.log('[' + this.name + '] ' + text, level);
}

NikobusAccessoryPushbuttonModuleButton.prototype.setPowerState = function(value)
{
	this.mylog('NikobusAccessoryPushbuttonModuleButton.setPowerState() enter', 5);
	this.log('value = ' + value, 7);
	var previous = this.state;
	var next = !!value;
	this.state = next;
	this.platform.nikobus.queue.push(this.name + ' setPowerState ' + next, {},
		function(args, callback)
		{
			this.pushbutton.push(this.pushbuttonArea,
				function(err)
				{
					this.log('NikobusModulePushbutton.push() callback (err = ' + err + ')', err ? 1 : 8);
					callback(err);
					if (err)
					{
						this.state = previous;
						if (this._onCharacteristic)
						{
							this._onCharacteristic.updateValue(previous);
						}
					}
				}.bind(this)
			);
		}.bind(this)
	);
	this.mylog('NikobusAccessoryPushbuttonModuleButton.setPowerState() leave', 9);
	return next;
}

NikobusAccessoryPushbuttonModuleButton.prototype.getPowerState = function()
{
	this.mylog('NikobusAccessoryPushbuttonModuleButton.getPowerState() enter', 5);
	var value = this.state;
	this.log('value = ' + value, 7);
	this.mylog('NikobusAccessoryPushbuttonModuleButton.getPowerState() leave', 9);
	return value;
}

NikobusAccessoryPushbuttonModuleButton.prototype.getServices = function()
{
	this.mylog('NikobusAccessoryPushbuttonModuleButton.getServices() enter', 5);
	var services = [];

	var Service = this.platform.api.hap.Service;
	var Characteristic = this.platform.api.hap.Characteristic;

	var service = new Service.AccessoryInformation();
	service.setCharacteristic(Characteristic.Manufacturer, 'Niko');
	service.setCharacteristic(Characteristic.Model, this.pushbutton.model);
	service.setCharacteristic(Characteristic.SerialNumber, utils.intToHex(this.pushbutton.address, 6) + '-' + this.pushbuttonArea);
	services.push(service);

	switch (this.serviceType)
	{
		case 'switch':
		{
			var switchService = new Service.Switch(this.name);
			this._onCharacteristic = switchService.getCharacteristic(Characteristic.On);
			this._onCharacteristic
				.onGet(this.getPowerState.bind(this))
				.onSet(this.setPowerState.bind(this));
			services.push(switchService);
		}
		break;
		case 'lightbulb':
		{
			var lightService = new Service.Lightbulb(this.name);
			this._onCharacteristic = lightService.getCharacteristic(Characteristic.On);
			this._onCharacteristic
				.onGet(this.getPowerState.bind(this))
				.onSet(this.setPowerState.bind(this));
			services.push(lightService);
		}
		break;
	}

	this.mylog('NikobusAccessoryPushbuttonModuleButton.getServices() leave', 9);
	return services;
}

module.exports =
{
	NikobusAccessoryPushbuttonModuleButton
}
