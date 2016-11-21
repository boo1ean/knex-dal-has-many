var _ = require('lodash');
var assert = require('assert');
var Promise = require('bluebird');

var methodBuilders = {
	create: function buildCreateWithChildren (relations) {
		return function createWithChildren (params) {
			return this.create(params)
				.tap(createItems);

			function createItems (parentId) {
				return Promise.map(relations, createRelationItems)

				function createRelationItems (relation) {
					if (_.isArray(params[relation.field])) {
						return Promise.map(
							params[relation.field].map(attachReference),
							relation.methods.create
						);
					}
				}

				function attachReference (item) {
					item[relation.foreignKey] = parentId;
					return item;
				}
			}

		}
	},

	update: function buildUpdateWithChildren (relations) {
		return function createWithChildren (params) {
			var knex = this.knex;

			return this.update(params)
				.then(processItems)
				.return(params.id);

			function processItems () {
				return Promise.map(relations, function (relation) {
					if (_.isArray(params[relation.field])) {
						return findMissingItems()
							.then(removeMissingItems)
					}

					function findMissingItems () {
						var childrenIds = _.map(params[relation.field], 'id');
						return knex(relation.table)
							.where(relation.foreignKey, params.id)
							.whereNotIn('id', childrenIds)
							.select('id')
					}

					function removeMissingItems (missingItemsIds) {
						return Promise.map(missingItemsIds, relation.methods.remove);
					}

					function createOrUpdateItems () {
						return Promise.map(
							params[relation.field].map(attachReference),
							createOrUpdate
						);

						function attachReference (item) {
							item[relation.field] = params.id;
							return item;
						}

						function createOrUpdate (params) {
							if (params.id) {
								return relation.methods.update(params);
							}

							return relation.methods.create(params);
						}
					}
				});
			}
		}
	}
}

function createMethods (opts) {
	assert(opts.methods || _.isEmpty(opts.methods), 'Configuring hasMany relation without methods does not make sense');
	assert(opts.relations && _.isArray(opts.relations), 'relations must be array')
	opts.relations.forEach(validateRelation);

	var methods = {};

	for (var methodName in opts.methods) {
		methods[opts.methods[methodName]] = methodBuilders[methodName](opts.relations);
	}

	return methods;
}

function validateRelation (opts) {
	assert(opts.table, 'child table name is required to configure has-many relationn');
	assert(opts.field, 'property name is required to to configure has-many relation');
	assert(opts.foreignKey, 'childForeignKey is required to configure has-many relation');
	assert(opts.methods, 'child methods map is required to configure has-many relation');
	assert(opts.methods.remove, 'remove child method is required to configure has-many relation');
	assert(opts.methods.create, 'create child method is required to configure has-many relation');
	assert(opts.methods.update, 'update child method is required to configure has-many relation');
}

module.exports = createMethods;
