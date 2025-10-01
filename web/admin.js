import express from "express";
import db from "../db/index.js";
import { agePretty } from "../lib/utils.js";
import config from "../config.js";
const adminRouter = express.Router();
adminRouter.get("/", async (req, res, next) => {
	if (!res.locals.forAdmin) return next();
	res.render("listsites");
});
adminRouter.get("/admin", async (req, res, next) => {
	if (!res.locals.forAdmin) return next();
	if (res.locals.site?.id) {
		const siteObj = await db.Site.findByPk(res.locals.site.id, { include: [
			db.Item
		]});	
		res.locals.site = siteObj;
		res.locals.site.Items.forEach((item) => {
			item.age = config.timeUntilLock - (Math.floor((Date.now() - new Date(item.lastUpdated)) / 1000));
			item.agePretty = agePretty(item.age);
		});
		res.render("listadmin");
	} else {
		res.locals.error = "Couldn't find site?";
		res.render("error");
	}
});
adminRouter.post("/admin", async (req, res, next) => {
	if (!res.locals.forAdmin) return next();
	const siteObj = await db.Site.findByPk(res.locals.site.id, { include: [
		db.Item
	]});
	siteObj.Items.forEach(async (item) => {
		const age = config.timeUntilLock - (Math.floor((Date.now() - new Date(item.lastUpdated)) / 1000));
		if (age > 0 && !item.ClaimedById) {
			let isDirty = false;
			if (req.body[`itemName.${item.id}`] && req.body[`itemDescription.${item.id}`]) {
				[["itemName", "name"], ["itemDescription", "description"], ["itemURL", "URL"], ["itemPrice", "price"]].forEach((field) => {
					if (req.body[`${field[0]}.${item.id}`] && req.body[`${field[0]}.${item.id}`] !== item[field[1]]) {
						if (field[0] == "itemPrice") {
							const price = parseInt(parseFloat(req.body[`itemPrice.${item.id}`]) * 100,10);
							if (price == item.price) return;
							else {
								item.price = price;
							}
						} else {
							item[field[1]] = req.body[`${field[0]}.${item.id}`];
						}
						isDirty = true;

						item.lastUpdated = Date.now();
					}
					// If it had a value, but no longer does.
					if (item[field[1]] && !req.body[`${field[0]}.${item.id}`]) {
						item[field[1]] = null;
						isDirty = true;
						item.lastUpdated = Date.now();
					}
				});
			}
			if (req.body[`itemDelete.${item.id}`]) await item.destroy();
			else if (isDirty) await item.save();
		}
	});
	if (req.body["itemName.NEW"] && req.body["itemDescription.NEW"]) {
		await siteObj.createItem({
			name: req.body["itemName.NEW"],
			description: req.body["itemDescription.NEW"],
			URL: req.body["itemURL.NEW"],
			price: parseInt(parseFloat(req.body["itemPrice.NEW"]) * 100,10)
		});
	}
	if (req.body.siteName && req.body.siteName !== siteObj.siteName) siteObj.siteName = req.body.siteName;
	if (
		req.body.subDomain && 
		String(req.body.subDomain).toLowerCase() !== String(siteObj.subDomain).toLowerCase() && 
		!res.app.locals.siteList.find((el) => String(el.subDomain).toLowerCase() === String(req.body.subDomain))
	) siteObj.subDomain = String(req.body.subDomain).toLowerCase();
	if (req.body.viewPassword && req.body.viewPassword !== siteObj.viewPassword) siteObj.viewPassword = req.body.viewPassword;
	else if (!req.body.viewPassword && siteObj.viewPassword) siteObj.viewPassword = "";
	await siteObj.save();
	await siteObj.reload();
	siteObj.Items.forEach((item) => {
		item.age = config.timeUntilLock - (Math.floor((Date.now() - new Date(item.lastUpdated)) / 1000));
		item.agePretty = agePretty(item.age);
	});
	res.app.locals.siteList = await db.Site.findAll({ raw: true });
	res.locals.site = siteObj;
	res.render("listadmin");
});
export default adminRouter;