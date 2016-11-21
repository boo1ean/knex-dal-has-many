## knex-dal-has-many

Has-many relation mixin for [knex-dal](https://github.com/boo1ean/knex-dal)

## Installation

```
npm install knex-dal-has-many
```

## Usage

Given dal configuration

```javascript
var hasMany = require('knex-dal-has-many');
var dal = require('knex-dal');
var itemsDal = require('./items/dal');
var knex = require('../services/db');

var table = 'grids';
var createAndUpdateFields = ['title'];

module.exports = dal({
	table: table,
	knex: knex,
	softDeleteColumn: softDeleteColumn,
	mixins: [
		hasMany({
			methods: {
				create: 'createWithItems',
				update: 'updateWithItems',
			},
			relations: [{
				table: 'items',
				foreignKey: 'grid_id',
				field: 'items',
				methods: {
					create: itemsDal.create.bind(itemsDal),
					update: itemsDal.update.bind(itemsDal),
					remove: itemsDal.remove.bind(itemsDal)
				}
			}]
		})
	],
	pick: {
		create: createAndUpdateFields,
		update: createAndUpdateFields
	}
});
```

Allows to store hierarchical data with one function call:

```javascript
var gridsDal = require('./grids/dal');

gridsDal.createWithItems({
	title: 'new grid',
	items: [
		{ title: 'item 1' },
		{ title: 'item 2' }
	]
});
```
Above code will create record in `grids` table and then create two related records in `grid_items` table.

## Available methods

### create

Create record with child records

### update

Update record with child records
