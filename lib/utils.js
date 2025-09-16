import crypto from "crypto";
import config from "../config.js";

export function createPasswordHash(password) {
	return crypto.scryptSync(password, config.passwordSalt, config.passwordHashLength).toString("base64");
}