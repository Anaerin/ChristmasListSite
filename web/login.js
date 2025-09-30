import express from "express";
import db from "../db/index.js";
import { createPasswordHash } from "../lib/utils.js";
//import URL from "node:url";
import config from "../config.js";
const loginRouter = express.Router();

loginRouter.get("/login", (req, res) => {
	if (req.query.previous) {
		const previousURL = new URL(req.query.previous, `https://${req.app.locals.baseURL}/`);
		
		// Prevent XSS attacks by stripping out all hostnames etc and returning a relative path.
		res.locals.previous = previousURL.pathname;
		if (previousURL.search) res.locals.previous += `?${previousURL.search}`;
	}
	if (req.session.loginError) res.locals.errorMessage = req.session.loginError
	if (req.session.userName) res.locals.userName = req.session.userName;
	if (req.session.password) res.locals.password = req.session.password;
	res.render("login");
});
loginRouter.post("/login", async (req, res) => {
	const userName = req.body.userName;
	req.session.userName = res.locals.userName = userName;
	const postedPassword = req.body.password;
	req.session.password = res.locals.password = postedPassword;
	const passwordHash = createPasswordHash(postedPassword);
	const foundUser = await db.User.findOne({
		where: {
			name: userName,
			password: passwordHash
		}, 
		raw: true
	});
	if (foundUser) {
		req.session.userId = foundUser.id;
		req.session.user = foundUser;
		res.setHeader("Logged-In-As", foundUser.id);
		if (req.body.previous) {
			const previousURL = new URL(req.body.previous, `https://${req.app.locals.baseURL}/`);
			// Prevent XSS attacks by stripping out all hostnames etc and returning a relative path.
			res.locals.previous = previousURL.pathname;
			if (previousURL.search) res.locals.previous += `?${previousURL.search}`;			
			res.redirect(res.locals.previous);
		} else res.redirect("/");
	} else {
		res.locals.errorMessage = `Incorrect username or password`;
		res.render("login");
		//res.redirect(`/login?previous=${encodeURIComponent(req.body.previous)}`);
	}
});
if (config.registrationEnabled) {
	loginRouter.get("/register", (req, res) => {
		if (req.session.userName) res.locals.userName = req.session.userName;
		if (req.session.password) res.locals.password = req.session.password;
		if (req.query.previous) {
			const previousURL = new URL(req.query.previous, `https://${req.app.locals.baseURL}/`);
			
			// Prevent XSS attacks by stripping out all hostnames etc and returning a relative path.
			res.locals.previous = previousURL.pathname;
			if (previousURL.search) res.locals.previous += `?${previousURL.search}`;
		}	
		if (req.session.errorMessage) {
			res.locals.errorMessage = req.session.errorMessage;
			delete req.session.errorMessage
		}
		res.render("register");
	});
	loginRouter.post("/register", async (req, res) => {
		let err = false;
		const userName = req.body.userName;
		const findUser = await db.User.findOne({
			where: {
				name: userName
			},
			raw: true
		});
		if (findUser) {
			res.locals.errorMessage = "A user with that name already exists";
			res.render("register");
		} else {
			const postedPassword = req.body.password;
			const passwordHash = createPasswordHash(postedPassword);
			const newUser = await db.User.create({
				name: userName,
				password: passwordHash
			}, { raw: true });
			req.session.userId = newUser.id;
			req.session.user = newUser;
			if (req.body.previous) res.redirect(req.body.previous);
			else res.redirect("/");
		}
	});
}
loginRouter.get("/myaccount", async (req, res) => {
	if (checkUser(req, res)) {
		const userEntry = await db.User.findByPk(req.session.userId, { include: db.Site });
		res.locals.user = userEntry;
		const URLBuilder = new URL("https://localhost/admin");
		URLBuilder.host = req.headers.host; // To get the port number as well
		URLBuilder.hostname = res.app.locals.baseURL;
		URLBuilder.protocol = req.protocol;
		URLBuilder.pathname = "/admin";
		res.locals.AdminSiteURL = URLBuilder.href;
		if (req.query.claim) {
			const userSite = await userEntry.getSite();
			if (userSite) res.redirect(res.locals.AdminSiteURL);
			else {
				await userEntry.createSite({
					siteName: userEntry.name,
					subDomain: String(userEntry.name).toLowerCase()
				});
				let siteList = await db.Site.findAll({ raw: true });
				res.app.locals.siteList = siteList;
				res.redirect(res.locals.AdminSiteURL);
			}
		} else {
			res.render("myaccount");
		}
	}
});
loginRouter.post("/myaccount", async (req, res) => {
	if (checkUser(req, res)) {
		const userEntry = await db.User.findByPk(req.session.userId);
		let isDirty = false;
		if (req.body.userName !== userEntry.name) {
			userEntry.name = req.body.userName;
			isDirty = true;
		}
		if (req.body.oldPassword) {
			if (createPasswordHash(oldPassword) == userEntry.password) {
				if (req.body.newPassword && req.body.newPassword == req.body.newPasswordAgain) {
					userEntry.password = createPasswordHash(req.body.newPassword);
					isDirty = true;
				} else {
					res.locals.errorMessage = "Passwords don't match";
				}
			} else {
				res.locals.errorMessage = "Old password is not correct";
			}
		}
		if (isDirty) {
			await userEntry.save();
			res.locals.errorMessage = "Account updated!";
		}
		res.locals.user = userEntry;
		res.render("myaccount");
	}
})
loginRouter.get("/logout", async (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			res.locals.errorMessage = `Error logging out: ${err}`;
			res.render("error");
		} else res.redirect("/");
	});
});
function checkUser(req, res) {
	if (!req.session.userId) {
		const redirectURL = new URL(`https://localhost/`);
		redirectURL.host = req.headers.host; // To get the port number as well
		redirectURL.hostname = req.hostname;
		redirectURL.protocol = req.protocol;
		redirectURL.pathname = req.originalUrl;
		const URLBuilder = new URL("https://localhost/admin");
		URLBuilder.host = req.headers.host; // To get the port number as well
		URLBuilder.hostname = res.app.locals.baseURL;
		URLBuilder.protocol = req.protocol;
		URLBuilder.pathname = "/login";
		if (redirectURL.hostname.endsWith(req.app.locals.baseURL)) {
			URLBuilder.searchParams.append("previous", redirectURL.href);
			res.redirect(URLBuilder.href);
		} else {
			console.warn(`Missing URL?`);
			console.info(res.app.locals.baseURL);
			console.info(req.originalUrl);
			res.locals.error = `Previous URL is not under ${res.app.locals.baseURL}: ${req.originalUrl}`;
			res.render("error");
		}
		return false;
	} else {
		let mySite = res.app.locals.siteList.find((el) => el.UserId == req.session.userId);
		if (mySite) res.locals.hasClaimedSite = true;		
		return true;
	}
}
async function checkLogin(req, res, next) {
	if (checkUser(req, res)) {
		res.setHeader("GotUserID", req.session.userId);
		const userEntry = await db.User.findByPk(req.session.userId);
		res.locals.user = userEntry;
		res.locals.userId = req.session.userId;
		next();
	} 
}
export { loginRouter, checkLogin };