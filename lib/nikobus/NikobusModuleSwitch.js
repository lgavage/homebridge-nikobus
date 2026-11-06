'use strict';

var utils = require('./utils');

function NikobusModuleSwitch(log, api, name, model, address)
{
	this.log = log;
	this.log('NikobusModuleSwitch() enter', 5);
	this.log('name = ' + name + ', ' + 'model = ' + model + ', ' + 'address = ' + utils.intToHex(address, 4), 7);
	this.api = api;
	this.name = name;
	this.model = model;
	this.address = address;
	// Cached 12-char hex state per group (1 or 2), e.g. "00FF000000FF"
	this.groupState = {};
	this.log('NikobusModuleSwitch() leave', 9);
}

NikobusModuleSwitch.prototype.getGroupOutputState = function(group, timeout, callback)
{
	this.log('NikobusModuleSwitch.getGroupOutputState() enter', 5);
	this.log('group = ' + group + ', ' + 'timeout = ' + timeout, 7);
	this.api.getOutputState(this.address, group, timeout,
		function(err, answer)
		{
			this.log('NikobusApi.getOutputState() callback (err = ' + err + ', answer = ' + answer + ')', err ? 1 : 8);
			if (!err && answer)
			{
				this.groupState[group] = answer;
			}
			callback(err, answer);
		}.bind(this)
	);
	this.log('NikobusModuleSwitch.getGroupOutputState() leave', 9);
}

NikobusModuleSwitch.prototype.setGroupOutputState = function(group, value, timeout, callback)
{
	this.log('NikobusModuleSwitch.setGroupOutputState() enter', 5);
	this.log('group = ' + group + ', ' + 'value = ' + value + ', ' + 'timeout = ' + timeout, 7);
	this.api.setOutputState(this.address, group, value, timeout,
		function(err, answer)
		{
			this.log('NikobusApi.setOutputState() callback (err = ' + err + ', answer = ' + answer + ')', err ? 1 : 8);
			if (!err)
			{
				this.groupState[group] = value;
			}
			callback(err, answer);
		}.bind(this)
	);
	this.log('NikobusModuleSwitch.setGroupOutputState() leave', 9);
}

NikobusModuleSwitch.prototype.getOutputState = function(number, timeout, callback)
{
	this.log('NikobusModuleSwitch.getOutputState() enter', 5);
	this.log('number = ' + number + ', ' + 'timeout = ' + timeout, 7);
	var groupNumber = Math.floor((number + 5) / 6);
	var groupOutputNumber = (number - 1) % 6;
	this.api.getOutputState(this.address, groupNumber, timeout,
		function(err, answer)
		{
			this.log('NikobusApi.getOutputState() callback (err = ' + err + ', answer = ' + answer + ')', err ? 1 : 8);
			if (err)
			{
				callback(err, null);
				return;
			}
			this.groupState[groupNumber] = answer;
			answer = answer.substr(groupOutputNumber * 2, 2);
			callback(null, answer);
		}.bind(this)
	);
	this.log('NikobusModuleSwitch.getOutputState() leave', 9);
}

NikobusModuleSwitch.prototype.setOutputState = function(number, value, timeout, callback)
{
	this.log('NikobusModuleSwitch.setOutputState() enter', 5);
	this.log('number = ' + number + ', ' + 'value = ' + value + ', ' + 'timeout = ' + timeout, 7);
	var groupNumber = Math.floor((number + 5) / 6);
	var groupOutputNumber = (number - 1) % 6;

	var applySet = function(old_value)
	{
		var new_value = old_value.substr(0, groupOutputNumber * 2) + value + old_value.substr((groupOutputNumber + 1) * 2, (6 - groupOutputNumber - 1) * 2);
		if (old_value == new_value)
		{
			this.log('no need to change output state', 9);
			callback(null);
			return;
		}
		this.api.setOutputState(this.address, groupNumber, new_value, timeout,
			function(err, answer)
			{
				this.log('NikobusApi.setOutputState() callback (err = ' + err + ', answer = ' + answer + ')', err ? 1 : 8);
				if (err)
				{
					callback(err);
					return;
				}
				if (answer != 'FF00')
				{
					callback(new Error('unexpected answer (' + answer + ')'));
					return;
				}
				this.groupState[groupNumber] = new_value;
				callback(null);
			}.bind(this)
		);
	}.bind(this);

	// Prefer cached group state so a set is one bus round-trip, not two.
	if (this.groupState[groupNumber])
	{
		applySet(this.groupState[groupNumber]);
		this.log('NikobusModuleSwitch.setOutputState() leave (cached)', 9);
		return;
	}

	this.api.getOutputState(this.address, groupNumber, timeout,
		function(err, answer)
		{
			this.log('NikobusApi.getOutputState() callback (err = ' + err + ', answer = ' + answer + ')', err ? 1 : 8);
			if (err)
			{
				callback(err);
				return;
			}
			this.groupState[groupNumber] = answer;
			applySet(answer);
		}.bind(this)
	);
	this.log('NikobusModuleSwitch.setOutputState() leave', 9);
}

module.exports =
{
	NikobusModuleSwitch
}
