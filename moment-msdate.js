'use strict';

(function(root, factory) {
	/*global define*/
	if (typeof define === 'function' && define.amd) {
		define(['moment', 'moment-timezone'], factory); // AMD
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('moment'), require('moment-timezone')); // Node
	} else {
		factory(root.moment, root.moment.tz); // Browser
	}
}(this, function(moment, momentTimezone) {
	var MINUTE_MILLISECONDS = 60 * 1000;
	var DAY_MILLISECONDS = 86400000;
	var MS_DAY_OFFSET = 25569;

	const momentVersion = moment.version.split('.');
	const major = +momentVersion[0];
	const minor = +momentVersion[1];

	if (major < 2 || (major === 2 && minor < 6)) {
		throw new Error('moment-msdate requires Moment.js >= 2.6.0. You are using Moment.js ' + moment.version + '. See momentjs.com');
	}

	if (!momentTimezone || !moment.tz) {
		throw new Error('moment-msdate requires moment-timezone.js. see momentjs.com/timezone');
	}

	const oaDateToTicks = function(oaDate) {
		var ticks = ((oaDate - MS_DAY_OFFSET) * DAY_MILLISECONDS);
		if (oaDate < 0) {
			const frac = (oaDate - Math.trunc(oaDate)) * DAY_MILLISECONDS;
			if (frac !== 0) {
				ticks -= frac * 2;
			}
		}
		return ticks;
	};

	const ticksToOADate = function(ticks) {
		var oad = (ticks / DAY_MILLISECONDS) + MS_DAY_OFFSET;
		if (oad < 0) {
			const frac = oad - Math.trunc(oad);
			if (frac !== 0) {
				oad = Math.ceil(oad) - frac - 2;
			}
		}
		return oad;
	};

	/**
	 * @description takes an oaDate that is not in utc and converts it to a utc moment offset by a number of minutes
	 *
	 * @param {double} oaDate
	 * @param {string} offsetToUtcInMinutes
	 * @returns moment
	 */
	const fromOADateOffsetToUtcByMinutes = function(oaDate, offsetToUtcInMinutes) {
		const offsetInTicks = offsetToUtcInMinutes * MINUTE_MILLISECONDS;
		const ticks = oaDateToTicks(oaDate);
		return moment(ticks + offsetInTicks).utc();
	};

	/**
	 * @description takes an oaDate that is not in utc and converts it to a utc moment offset by the specified timezone
	 *
	 * @param {double} oaDate
	 * @param {string} timezone
	 * @returns moment
	 */
	const fromOADateOffsetToUtcByTimezone = function(oaDate, timezone) {
		if (!moment.tz.zone(timezone)) {
			throw new Error('timezone provided is not available in moment-timezone.js', 'moment-msdate.js', 59);
		}
		const ticks = oaDateToTicks(oaDate);
		const offset = moment(ticks).tz(timezone).utcOffset() * MINUTE_MILLISECONDS;
		return moment.tz(ticks - offset, timezone).utc();
	};

	/**
	 * @description takes an oaDate that is in utc and converts it to a utc moment or takes an oaDate and an offset to utc and converts it to a utc moment. The offset can be an int representing the offset to utc in minutes or a string indicating the timezone of the oaDate.
	 *
	 * @param {double} oaDate
	 * @param {string=} {int=} offset
	 * @returns moment
	 */
	moment.fromOADate = function(oaDate, offset) {
		if (Number.isNaN(parseInt(oaDate, 10))) {
			throw new TypeError('fromOADate requires an oaDate that is not null or undefined', 'moment-msdate.js', 72);
		}

		/* no offset */
		if (!offset) {
			return fromOADateOffsetToUtcByMinutes(oaDate, 0);
		}

		/* timezone */
		const parsedOffset = parseInt(offset, 10);
		if (Number.isNaN(parsedOffset)) {
			return fromOADateOffsetToUtcByTimezone(oaDate, offset);
		}

		/* minutes */
		return fromOADateOffsetToUtcByMinutes(oaDate, parsedOffset);
	};

	/**
	 * @description converts a moment to a UTC OLE automation date represented as a double
	 *
	 * @returns {double}
	 */
	moment.fn.toOADate = function() {
		const milliseconds = this.valueOf();
		return ticksToOADate(milliseconds);
	};


	return moment;
}));
