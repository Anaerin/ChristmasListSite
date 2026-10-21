import fs from "fs";
import crypto from "crypto";

// Store if the config differs from config.json
let configFileDirty = true;
let hasConfig = false;
// set up default values.
let config = {
	sqlSetup: {
		dialect: "sqlite",
		storage: "lists.sqlite"
	},
	trustProxy: true,
	siteHeader: "Gift List Site",
	passwordSalt: "Something secure to add to the password for randomness",
	passwordHashLength: 128,
	sessionPassword: "A secure option for the session",
	registrationEnabled: true,
	baseURL: "example.com",
	timeUntilLock: 604800, //seconds until items locked. 7 days.
	timeUntilPurge: 7776000 //seconds until item purgable, 90 days.
};

// If we have a config file...
if (fs.existsSync("config.json")) {
	// Read it in and parse it...
	const configFile = fs.readFileSync("config.json", { encoding: "utf8"});
	const configJSON = JSON.parse(configFile);

	// Make sure the internal config object matches
	for (const key in configJSON) {
		config[key] = configJSON[key];
	};

	// File is in sync with the internal config.
	configFileDirty = false;
	hasConfig = true;
}

// Now, for each key in the config
for (const key in config) {
	// If it's an object type with subkeys (looking at you, SQL setup)
	if (typeof config[key] == "object") {
		// Iterate through each subkey
		for (const subkey in config[key]) {
			const fullSubKey = key + "." + subkey;
			// If there's an environment variable defined, and it differs from the current config value
			if (process.env[fullSubKey] && process.env[fullSubKey] !== config[key][subkey]) {
				// Update the current config
				config[key][subkey] = process.env[fullSubKey];
				// And note we're no longer in sync with the config file.
				configFileDirty = true;
			}
		}
	} else if (process.env[key]) {
		if (process.env[key] != config[key]) {
			// If it's a primitive value, and it has an environment variable that differs from the current config value.
			// Update the current config
			config[key] = process.env[key];
			// And note we're no longer in sync with the config file.
			configFileDirty = true;
		}
	} else if (!hasConfig && (key == "passwordSalt")) {
		// We had no config file, and we've not been given a salt or key for passwords.
		// Therefore, we create our own.
		console.warn(`Couldn't find password salt. Generating random one.`);
		config.passwordSalt = crypto.randomBytes(256).toString("base64");
		config.sessionPassword = crypto.randomBytes(265).toString("base64");
		configFileDirty = true;
	}
}


if (configFileDirty) {
	// The internal config doesn't match the file, 
	// either because something changed due to env variables, 
	// or the file didn't exist
	// Either way, write a new one, for next time.
	fs.writeFileSync("config.json", JSON.stringify(config, null, '\t'), { encoding: "utf8" });
	// We're back in sync.
	configFileDirty = false;
}
config.domainLength = (config.baseURL.split(".").length);
export default config;