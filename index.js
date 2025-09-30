import { default as db, sequelize } from "./db/index.js";
import express from "express";
import config from "./config.js";
//import URL from "url";
import session from "express-session";
import SequelizeStore from "connect-session-sequelize";

import { loginRouter, checkLogin } from "./web/login.js";
import listRouter from "./web/lists.js";
import adminRouter from "./web/admin.js";

const app = express();
let siteList = await db.Site.findAll({ raw: true });

// Set some options.
if (config.domainLength != 2) app.set("subdomain offset", config.domainLength);
app.set("trust proxy", config.trustProxy);
app.set("views", process.cwd() + "/templates");
app.set("view engine", "ejs");
app.locals.baseURL = config.baseURL;
app.locals.registrationEnabled = config.registrationEnabled;
app.locals.siteList = siteList;
app.locals.header = config.siteHeader;

const SequelizeStoreEngine = SequelizeStore(session.Store);
const sequelizeStore = new SequelizeStoreEngine({
	db: sequelize
});
app.use(
	session({
		secret: config.sessionPassword,
		store: sequelizeStore,
		resave: false,
		proxy: true,
		rolling: true,
		saveUninitialized: false,
		maxAge: 30 * 24 * 60 * 60 * 1000,
		cookie: {
			domain: config.baseURL
		}
	})
);
sequelizeStore.sync();

app.use(express.static("static"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
	res.app.locals.siteList.forEach((site) => {
		const URLBuilder = new URL("https://localhost/");
		URLBuilder.host = req.headers.host; // To get the port number as well
		URLBuilder.hostname = site.subDomain + "." + res.app.locals.baseURL;
		URLBuilder.protocol = req.protocol;
		site.fullURL = URLBuilder.href;
	});
	const listURL = new URL("https://localhost/");
	listURL.host = req.headers.host; // To get the port number as well
	listURL.hostname = res.app.locals.baseURL;
	listURL.protocol = req.protocol;
	res.locals.siteListURL = listURL.href;
	const adminURL = new URL("https://localhost/admin");
	adminURL.host = req.headers.host; // To get the port number as well
	adminURL.hostname = res.app.locals.baseURL;
	adminURL.protocol = req.protocol;	
	res.locals.adminSiteURL = adminURL.href;
	res.locals.hasClaimedSite = false;
	next();
});
// Make sure the login routes are available first.
app.use(loginRouter);

// Ensure the user is logged in.
app.use(checkLogin);

// Try to find the right subdomain, or admin domain.
app.use(async (req, res, next) => {
	if (req.subdomains.length > 0) {
		const subdomain = req.subdomains.toReversed().join(".");
		let site = res.app.locals.siteList.find((el) => String(el.subDomain).toLowerCase() == String(subdomain).toLowerCase());
		if (site) {
			if (site.UserId == req.session.userId) {
				res.redirect(res.locals.adminSiteURL);
			} else {
				res.locals.site = site;
				res.locals.siteId = site.id;
				res.locals.hasSite = true;
				return next();
			}
		} else res.render("error", { error: `Couldn't find site ${subdomain}`});
	} else {
		res.locals.forAdmin = true;
		let site = res.app.locals.siteList.find((el) => el.UserId == req.session.userId);
		res.locals.site = site;
		return next();
	}
});
app.use(adminRouter);
app.use(listRouter);
app.listen(3000, () => {
	console.log(`Listening on port 3000`);
});