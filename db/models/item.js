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
			isClaimed: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			isPurchased: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			isShipped: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			fileName: DataTypes.STRING,
			isFetched: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			}
		}, {sequelize, modelName: "Item", timestamps: false});
	}
	static relation(models) {
		this.belongsTo(models.Site);
		this.belongsTo(models.User, { as: "Claimed" });
		this.belongsTo(models.User, { as: "Purchased" });
		this.belongsTo(models.User, { as: "Shipped" });
	}
}
