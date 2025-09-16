import express from "express";
const adminRouter = express.Router();
adminRouter.get("/", (req, res) => {
	res.render("listadmin");
});
export default adminRouter;