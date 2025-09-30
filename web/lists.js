import express from "express";
import db from "../db/index.js";

const listRouter = express.Router();
listRouter.get("/", async (req, res) => {
	const siteId = res.locals.siteId;
	if (!siteId) {
		res.statusCode = 500;
		res.render("error", { error: `Called listRouter without siteId` });
	} else {
		if (res.locals.site.UserId == req.session.userId) {
			const URLBuilder = new URL("https://localhost/");
			URLBuilder.host = req.headers.host; // To get the port number as well
			URLBuilder.hostname = res.app.locals.baseURL;
			URLBuilder.protocol = req.protocol;
			res.redirect(URLBuilder.href);
		} else {
			const siteEntry = await db.Site.findByPk(siteId, { include: [
				{
					model: db.Item,
					include: [
						"ClaimedBy",
						"PurchasedBy",
						"ShippedBy"
					]
				}
			]});
			if (!siteEntry) {
				res.statusCode = 500;
				res.render("error", { error: `Unable to fetch site ${siteId}` });
			} else {
				res.locals.site = siteEntry
				if (!siteEntry.viewPassword || (siteEntry.viewPassword && siteEntry.viewPassword == req.session.viewPassword)) {
					res.render("listpage");
				} else if (siteEntry.viewPassword) {
					res.render("listpagePassword");
				}
			}
		}
	}
});
listRouter.post("/", async (req, res) => {
	const siteId = res.locals.siteId;
	const siteEntry = await db.Site.findByPk(siteId, { include: [
		{
			model: db.Item,
			include: [
				"ClaimedBy",
				"PurchasedBy",
				"ShippedBy"
			]
		}
	]});
	if (!siteEntry) {
		res.statusCode = 500;
		res.render("error", { error: `Unable to fetch site ${siteId}` });
	} else {
		res.locals.site = siteEntry
		if (req.body.viewPassword && req.body.viewPassword == siteEntry.viewPassword) {
			req.session.viewPassword = req.body.viewPassword;
			res.redirect("/");
		} else {
			res.locals.error = `Incorrect password`;
			res.render("listpagePassword");
		}
	}
})
listRouter.get("/itemAction", async (req, res) => {
	const itemId = parseInt(req.query.itemId,10);
	const item = await db.Item.findByPk(itemId);
	switch (req.query.action) {
		case "claim":
			item.ClaimedById = res.locals.userId;
			break;
		case "unclaim":
			if (item.ClaimedById == res.locals.userId) item.ClaimedById = null;
			break;
		case "purchase":
			if (item.ClaimedById == res.locals.userId) item.PurchasedById = res.locals.userId;
			break;
		case "unpurchase":
			if (item.PurchasedById == res.locals.userId) item.PurchasedById = null;
			break;
		case "ship":
			if (item.PurchasedById == res.locals.userId) item.ShippedById = res.locals.userId;
			break;
		case "unship":
			if (item.ShippedById == res.locals.userId) item.ShippedById = null;
			break;
	}
	item.save();
	res.redirect("/");
});
export default listRouter;