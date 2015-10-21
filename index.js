var _ = require('lodash');
var assert = require('assert');
var Promise = require('bluebird');

var methodBuilders = {
	create: function buildCreateWithChildren (childDal, childrenPropertyName, childForeignKeyColumnName) {
		return function createWithChildren (params) {
			return this.create(params)
				.tap(createItems);

			function createItems (parentId) {
				return Promise.map(
					params[childrenPropertyName].map(attachReference),
					childDal.create
				);

				function attachReference (item) {
					item[childForeignKeyColumnName] = parentId;
					return item;
				}
			}

		}
	},

	update: function buildUpdateWithChildren (childDal, childrenPropertyName, childForeignKeyColumnName) {
		return function createWithChildren (params) {
			return this.update(params)
				.tap(createOrUpdateItems);

			function createOrUpdateItems (parentId) {
				return Promise.map(
					params[childrenPropertyName].map(attachReference),
					createOrUpdate
				);

				function attachReference (item) {
					item[childForeignKeyColumnName] = parentId;
					return item;
				}

				function createOrUpdate (params) {
					if (params.id) {
						return childDal.update(params);
					}

					return childDal.create(params);
				}
			}

		}
	}
}

function createMethods (opts) {
	assert(opts.childDal, 'Child DAL is required for configuring hasMany relation');
	assert(opts.property, 'property name is required to configure hasMany relation');
	assert(opts.childForeignKey, 'childForeignKey is required to configure hasMany relation');
	assert(opts.methods || _.isEmpty(opts.methods), 'Configuring hasMany relation without methods does not make sense');

	var methods = {};

	for (var methodName in opts.methods) {
		methods[methodName] = methodBuilders[opts.methods[methodName]](opts.childDal, opts.property, opts.childForeignKey);
	}

	return methods;
}

module.exports = createMethods;
