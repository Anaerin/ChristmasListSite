import { default as db, sequelize } from "./db/index.js";
import express from "express";
import config from "./config.js";
import URL from "url";
import session from "express-session";
import SequelizeStore from "connect-session-sequelize";


import { loginRouter, checkLogin } from "./web/login.js";
import listRouter from "./web/lists.js";
import adminRouter from "./web/admin.js";

const app = express();
const siteList = await db.Site.findAll({ raw: true });

// Set some options.
if (config.domainLength != 2) app.set("subdomain offset", config.domainLength);
app.set("trust proxy", config.trustProxy);
app.set("views", process.cwd() + "/templates");
app.set("view engine", "ejs");
app.locals.registrationEnabled = config.registrationEnabled;

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
		maxAge: 30 * 24 * 60 * 60 * 1000
	})
);
sequelizeStore.sync();

app.use(express.static("static"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make sure the login routes are available.
app.use(loginRouter);

// Ensure the user is logged in.
app.use(checkLogin);

// Try to find the right subdomain, or admin domain.
app.use((req, res, next) => {
	if (req.subdomains.length > 0) {
		const subdomain = req.subdomains.toReversed().join(".");
		if (subdomain === config.adminDomain) {
			return adminRouter;
		}
		siteList.forEach((site) => {
			if (site.subdomain == subdomain) {
				res.locals.siteEntry = site;
				req.session.siteId = site.id;
				req.session.hasSite = true;
				next();
			}
		});
		res.render("error", { error: `Couldn't find site ${subdomain}`});
	} else {
		res.render("error", { error: `No subdomain?`});
	}
})
app.use(listRouter);
app.listen(3000, () => {
	console.log(`Listening on port 3000`);
});