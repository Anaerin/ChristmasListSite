"use strict";
import Sequelize from "sequelize";

const Model = Sequelize.Model;
const DataTypes = Sequelize.DataTypes;

export default class Site extends Model {
	static init(sequelize) {
		super.init({
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			subDomain: DataTypes.STRING,
			siteName: DataTypes.STRING,
			adminPassword: DataTypes.STRING,
			viewPassword: DataTypes.STRING
		}, {sequelize, modelName: "Site", timestamps: false});
	}
	static relation(models) {
		this.hasMany(models.Item);
		this.belongsTo(models.User, { as: "owner" });
	}
}
