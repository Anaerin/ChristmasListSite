import express from "express";
import db from "../db/index.js";

const listRouter = express.Router();
listRouter.get("/", async (req, res) => {
	const thisSite = req.session.siteEntry;
	if (!siteEntry) {
		res.statusCode = 500;
		res.render("error", { error: `Called listRouter without siteEntry` });
	} else {
		const siteEntries = await db.models.Item.findAll({
			where: {
				siteId: thisSite.id
			},
			raw: true
		});
		res.render("listpage", {
			site: thisSite,
			items: siteEntries
		});
	}
});
export default listRouter;