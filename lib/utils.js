import crypto from "crypto";
import config from "../config.js";

export function createPasswordHash(password) {
	return crypto.scryptSync(password, config.passwordSalt, config.passwordHashLength).toString("base64");
}
export function agePretty(secondsToGo) {
	let out = "", timeParts = secondsToGo;
	out = `${padNumber(timeParts % 60,2)} seconds remaining`
	timeParts = Math.floor(timeParts / 60);
	if (timeParts > 0) {
		out = `${padNumber(timeParts % 60,2)} minutes, ${out}`;
		timeParts = Math.floor(timeParts / 60);
		if (timeParts > 0) {
			out = `${padNumber(timeParts % 24,2)} hours, ${out}`;
			timeParts = Math.floor(timeParts / 24);
			if (timeParts > 0) {
				out = `${timeParts} days, ${out}`;
			}
		}
	}
	return out;
}
export function purgePretty(days) {
	let remaining = 1 - days, out;
	out = `Purgeable in ${remaining} day`;
	if (remaining > 1) out+= "s";
	return out;
}
function padNumber(num, digits) {
	const padding = "0".repeat(digits);
	const paddedNumber = padding + Math.floor(num.toString(10));
	return paddedNumber.substring(paddedNumber.length - digits);
}