'use strict';

var url = require('url');
var Umzug = require('umzug');
var Sequelize = require('sequelize');
var DataTypes = require('sequelize/lib/data-types');

function createMigrator(opts) {
  if (opts.use_env_variable) {
    var databaseUrl = url.parse(process.env[opts.use_env_variable]);
    opts.database = databaseUrl.pathname.substring(1);
    if (databaseUrl.auth) {
      var auth = databaseUrl.auth.split(':');
      opts.username = auth[0];
      opts.password = auth[1];
    }
    opts.protocol = databaseUrl.protocol.split(':')[0];
    opts.dialect = opts.protocol;
  }

  var db = new Sequelize(opts.database, opts.username, opts.password, opts);

  return new Umzug({
    storage: 'sequelize',
    storageOptions: {
      sequelize: db,
      tableName: 'SequelizeMeta'
    },
    upName: 'up',
    downName: 'down',
    migrations: {
      params: [ db.getQueryInterface(), DataTypes ],
      path: opts.migrationsPath,
      pattern: /\.js$/
    },
    logging: opts.log
  });
}

module.exports = function createMigrateTask(opts) {
  var migrator = createMigrator(opts);

  var task = Object.create(migrator);
  task.undo = task.down;

  task.redo = function () {
    return this.down()
      .bind(this)
      .then(function () {
        return this.up();
      });
  };

  return task;
};

module.exports.createMigrator = createMigrator;
