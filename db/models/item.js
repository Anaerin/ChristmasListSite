"use strict";
import Sequelize from "sequelize";

const Model = Sequelize.Model;
const DataTypes = Sequelize.DataTypes;

export default class Item extends Model {
	static init(sequelize) {
		super.init({
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			name: DataTypes.STRING,
			description: DataTypes.STRING,
			URL: DataTypes.STRING,
			price: DataTypes.INTEGER,
			createdOn: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW
			},
			lastUpdated: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW
			}
		}, {sequelize, modelName: "Item", timestamps: false});
	}
	static relation(models) {
		this.belongsTo(models.Site);
		this.belongsTo(models.User, { as: "ClaimedBy" });
		this.belongsTo(models.User, { as: "PurchasedBy" });
		this.belongsTo(models.User, { as: "ShippedBy" });
	}
}
