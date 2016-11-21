var Promise = require('bluebird');
var _ = require('lodash');
var test = require('tape');
var hasMany = require('./');

test('multi relations cascade create', function (t) {
	var dal = {
		create: function () { return Promise.resolve({ id: 1 }) },
		update: function () { return Promise.resolve({ id: 2 }) }
	};

	var itemsTable = [];
	var items2Table = [];

	var expectedItemsTable = [
		{ id: 1, grid_id: { id: 1 } },
		{ id: 2, grid_id: { id: 1 } }
	];
	var expectedItems2Table = [
		{ id: 11, grid_id2: { id: 1 } },
		{ id: 22, grid_id2: { id: 1 } }
	];

	var methods = _.extend(dal, hasMany({
		methods: {
			create: 'createWithItems',
			update: 'updateWithItems',
		},
		relations: [
			{
				table: 'items',
				foreignKey: 'grid_id',
				field: 'items',
				methods: {
					create: function (p) { itemsTable.push(p); },
					update: function (p) {},
					remove: function (p) {}
				}
			}, {
				table: 'items2',
				foreignKey: 'grid_id2',
				field: 'items2',
				methods: {
					create: function (p) { items2Table.push(p); },
					update: function (p) {},
					remove: function (p) {}
				}
			}
		]
	}));

	t.ok(_.isFunction(methods.createWithItems));
	t.ok(_.isFunction(methods.updateWithItems));

	methods.createWithItems({
		items: [
			{ id: 1 },
			{ id: 2 },
		],
		items2: [
			{ id: 11 },
			{ id: 22 },
		]
	}).then(function () {
		t.deepEqual(itemsTable, expectedItemsTable);
		t.deepEqual(items2Table, expectedItems2Table);
		t.end();
	});
});

test('multi relations cascade create single field', function (t) {
	var dal = {
		create: function () { return Promise.resolve({ id: 1 }) },
	};

	var itemsTable = [];
	var items2Table = [];

	var expectedItemsTable = [
		{ id: 1, grid_id: { id: 1 } },
		{ id: 2, grid_id: { id: 1 } }
	];

	var expectedItems2Table = [];

	var methods = _.extend(dal, hasMany({
		methods: {
			create: 'createWithItems',
			update: 'updateWithItems',
		},
		relations: [
			{
				table: 'items',
				foreignKey: 'grid_id',
				field: 'items',
				methods: {
					create: function (p) { itemsTable.push(p); },
					update: function (p) {},
					remove: function (p) {}
				}
			}, {
				table: 'items2',
				foreignKey: 'grid_id2',
				field: 'items2',
				methods: {
					create: function (p) { items2Table.push(p); },
					update: function (p) {},
					remove: function (p) {}
				}
			}
		]
	}));

	t.ok(_.isFunction(methods.createWithItems));
	t.ok(_.isFunction(methods.updateWithItems));

	methods.createWithItems({
		items: [
			{ id: 1 },
			{ id: 2 },
		]
	}).then(function () {
		t.deepEqual(itemsTable, expectedItemsTable);
		t.deepEqual(items2Table, expectedItems2Table);
		t.end();
	});
});

test('multi relations cascade update single field', function (t) {
	var knex = function () { return knex; };
	knex.where = function () { return knex; }
	knex.whereNotIn = function () { return knex; }
	knex.select = function () { return Promise.resolve([5, 6]); }

	var dal = {
		update: function () { return Promise.resolve({ id: 1 }) },
		knex: knex
	};

	var createTable = [];
	var updateTable = [];
	var removeTable = [];

	var createTableExpected = [
		{ val: 2, grid_id: 1 },
	];
	var updateTableExpected = [
		{ id: 1, val: 1, grid_id: 1 },
		{ id: 3, val: 3, grid_id: 1 }
	];
	var removeTableExpected = [
		5, 6
	];

	var createTable2 = [];
	var updateTable2 = [];
	var removeTable2 = [];

	var createTableExpected2 = [];
	var updateTableExpected2 = [
		{ id: 11, val: 11, grid_id2: 1 },
		{ id: 33, val: 33, grid_id2: 1 }
	];
	var removeTableExpected2 = [
		5, 6
	];

	var methods = _.extend(dal, hasMany({
		methods: {
			create: 'createWithItems',
			update: 'updateWithItems',
		},
		relations: [
			{
				table: 'items',
				foreignKey: 'grid_id',
				field: 'items',
				methods: {
					create: function (p) { createTable.push(p); },
					update: function (p) { updateTable.push(p); },
					remove: function (p) { removeTable.push(p); }
				}
			}, {
				table: 'items2',
				foreignKey: 'grid_id2',
				field: 'items2',
				methods: {
					create: function (p) { createTable2.push(p); },
					update: function (p) { updateTable2.push(p); },
					remove: function (p) { removeTable2.push(p); }
				}
			}
		]
	}));

	t.ok(_.isFunction(methods.createWithItems));
	t.ok(_.isFunction(methods.updateWithItems));

	methods.updateWithItems({
		id: 1,
		items: [
			{ id: 1, val: 1 },
			{ val: 2 },
			{ id: 3, val: 3 },
		],
		items2: [
			{ id: 11, val: 11 },
			{ id: 33, val: 33 },
		],
	}).then(function () {
		t.deepEqual(createTable, createTableExpected);
		t.deepEqual(updateTable, updateTableExpected);
		t.deepEqual(removeTable, removeTableExpected);

		t.deepEqual(createTable2, createTableExpected2);
		t.deepEqual(updateTable2, updateTableExpected2);
		t.deepEqual(removeTable2, removeTableExpected2);
		t.end();
	});
});
