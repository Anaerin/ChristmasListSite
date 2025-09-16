"use strict";
import Sequelize from "sequelize";

const Model = Sequelize.Model;
const DataTypes = Sequelize.DataTypes;

export default class User extends Model {
	static init(sequelize) {
		super.init({
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			name: DataTypes.STRING,
			password: DataTypes.STRING
		}, {sequelize, modelName: "User", timestamps: false});
	}
	static relation(models) {
		this.hasMany(models.Item, { as: "claimed" });
		this.hasMany(models.Item, { as: "purchased" });
		this.hasMany(models.Item, { as: "shipped" });
		this.hasOne(models.Site, { as: "site" });
	}
}
