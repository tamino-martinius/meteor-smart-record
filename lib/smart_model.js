/**
 * Returns an singular version of the passed word.
 *
 * TODO: Common problem - should be replaced with some package.
 *
 * @param  {String} plural Plural version of the word
 * @return {String}        Singular version of the word
 */
const singularize = function(plural) {
  if (s.endsWith(plural, 'ies')) {
    return plural.substr(0, plural.length - 3) + 'y';
  } else if (s.endsWith(plural, 'es')) {
    return plural.substr(0, plural.length - 2);
  } else if (s.endsWith(plural, 's')) {
    return plural.substr(0, plural.length - 1);
  }
  return plural;
};

/**
 * Rails like models using ES6.
 *
 * Smart Record gives you the ability to:
 *
 * - Represent models and their data.
 * - Represent associations between these models.
 * - Represent inheritance hierarchies through related models.
 * - Validate models before they get persisted to the database.
 * - Perform database operations in an object-oriented fashion.
 */
SmartModel = class SmartModel {
  /**
   * Creates an new model instance.
   * @param  {Object}     attrs Initial attributes.
   * @return {SmartModel}       Returns new model instance.
   */
  constructor(attrs = {}) {
    let defaultAttrs = this.constructor.defaultScope;
    if (_.isArray(defaultAttrs)) {
      for (const defaultAttr of defaultAttrs) {
        this.extend(defaultAttr);
      }
    } else if (_.isObject(defaultAttrs)) {
      this.extend(defaultAttrs);
    }
    this._applyDefaults();
    this.extend(attrs);
    this._validationContext = this.constructor.simpleSchema().newContext();
    this._initBelongsToRelations();
    this._initHasManyRelations();
    this._initHasOneRelations();
    const idAlias = s.decapitalize(this.constructor.modelName) + 'Id';
    Object.defineProperty(this, idAlias, {
      get: () => this.id
    });
  }

  /**
   * Initialize Model.
   *
   * Add default scopes based on Schema.
   */
  static init() {
    const schema = this.getSchema();
    schema.id = {type: String};
    const checkedTypes = [String];
    const rangeTypes = [Number, Date];
    for (const column in schema) {
      const type = schema[column].type;

      {
        const scope = 'with' + s.capitalize(column);
        this[scope] = (val) => {
          if (_.contains(checkedTypes, type)) {
            check(val, type);
          }
          return this.scope({
            selector: {[column]: val},
          });
        };
      }
      if (_.contains(rangeTypes, type)) {

      }
    }
  }

  /**
   * Defines if the created Collection is local.
   *
   * @return {Boolean} Return true to create an unmanaged local collection.
   */
  static get localCollection() {
    return false;
  }

  /**
   * Private: Used to check if Model is inherited from SmartModel.
   *
   * @return {Boolean} Returns true.
   */
  static get __isSmartModel() {
    return true;
  }

  /**
   * Private: Initialize belongsTo relation.
   *
   * Sets the getter and setter for the model instance.
   */
  _initBelongsToRelations() {
    const relations = this.constructor.belongsTo;
    if (_.isObject(relations)) {
      for (let name in relations) {
        const relation = relations[name];
        const foreignKey = (relation.foreignKey || name) + 'Id';
        const model = this.constructor._getModel(relation, name);
        if (model === undefined) {
          continue;
        }
        Object.defineProperty(this, name, {
          get: () => {
            if (this[foreignKey] !== undefined && this[foreignKey] !== null) {
              return model.find({_id: this[foreignKey]}, relation.options);
            } else {
              return null;
            }
          },
          set: (obj) => {
            this[foreignKey] = obj.id;
            if (relation.polymorphic === true) {
              this[(relation.foreignKey || name) + 'Model'] = obj.constructor.modelName;
            }
            return obj;
          }
        });
      }
    }
  }

  /**
   * Private: Initialize hasMany relation.
   *
   * Creates scopes to the related models.
   */
  _initHasManyRelations() {
    const relations = this.constructor.hasMany;
    if (_.isObject(relations)) {
      for (let name in relations) {
        const relation = relations[name];
        const foreignKey = (relation.foreignKey || s.decapitalize(this.constructor.modelName) + 'Id');
        const model = this.constructor._getModel(relation, name);
        if (model === null) {
          continue;
        }
        Object.defineProperty(this, name, {
          get: () => {
            return this.constructor.scope({
              model: model.name,
              selector: {
                [foreignKey]: this.id
              },
            });
          },
          writeable: false,
        });
      }
    }
  }

  /**
   * Private: Initialize hasOne relation.
   *
   * Creates getter for related models.
   */
  _initHasOneRelations() {
    const relations = this.constructor.hasOne;
    if (_.isObject(relations)) {
      for (let name in relations) {
        const relation = relations[name];
        const foreignKey = (relation.foreignKey || s.decapitalize(this.constructor.modelName) + 'Id');
        const model = this.constructor._getModel(relation, name);
        if (model === null) {
          continue;
        }
        Object.defineProperty(this, name, {
          get: () => {
            const query = {};
            query[foreignKey] = this.id;
            return model.find(query);
          },
          writeable: false,
          // settings needs an inverseOf option to unset the belongsTo
          // on the model side or destroy model if belongsTo is required
          // set: (obj) => {
          // }
        });
      }
    }
  }

  /**
   * An array of properties which are allowed
   * to pass but not passed to the database.
   *
   * @return {Array} Array of property names.
   */
  static get attrAccessors() {
    return [];
  }

  /**
   * Private: Returns model either from relation or fallback.
   *
   * @param  {Object}     relation Relation provided by belongsTo, hasMany or hasOne.
   * @param  {String}     fallback Name of an model which can be used as fallback.
   *
   * @return {SmartModel}          Returns an SmartModel.
   */
  static _getModel(relation, fallback) {
    let model = null;
    if (relation.polymorphic === true) {
      model = global[s.classify(singularize(relation.foreignKey || fallback) + 'Model')];
    } else if (_.isString(relation.model)) {
      model = global[relation.model];
    } else if (_.isObject(relation.model)) {
      model = relation.model;
    } else {
      model = global[s.classify(singularize(fallback))];
    }
    if (model !== null && model.__isSmartModel !== true) {
      return null;
    }
    return model;
  }

  /**
   * Private: Transforms minimongo results to SmartModel instances.
   *
   * @param  {Object} options Passed options get modified.
   */
  static _applyDefaultTransform(options) {
    if (options.transform === undefined) {
      options.transform = (attrs) => {
        return new this(attrs);
      }
    }
  }

  /**
   * Private: Sorts the records by creation if no sort is present.
   *
   * @param  {Object} options Passed options get modified.
   */
  static _applyDefaultSort(options) {
    if (options.sort === undefined) {
      options.sort = {createdAt: 1};
    }
  }

  /**
   * Prepare the passed relation and return all dependend destroy relations names.
   *
   * @param  {Object} relations Either an hasOne or hasMany relation is expected
   * @return {Array}            Returns an array of relation names
   */
  static _getDependentDestroy(relations) {
    const dependentDestroy = [];
    if (_.isObject(relations)) {
      for (const name in relations) {
        const relation = relations[name];
        if (_.isString(relation.dependent)) {
          relation.dependent = [relation.dependent];
        }
        if (_.isArray(relation.dependent) && _.contains(relation.dependent, 'destroy')) {
          dependentDestroy.push(name);
        }
      }
    }
    return dependentDestroy;
  }

  /**
   * Get all relation dependent relation names from has one which should be destroyed.
   *
   * @return {Array} Returns an array of relation names
   */
  static get _hasOneDependentDestroy() {
    return this._getDependentDestroy(this.hasOne);
  }

  /**
   * Get all relation dependent relation names from has many which should be destroyed.
   *
   * @return {Array} Returns an array of relation names
   */
  static get _hasManyDependentDestroy() {
    return this._getDependentDestroy(this.hasMany);

  }

  /**
   * Private: Returns an selector which takes care of the own default scope.
   * Also sets the alias names for the id to _id.
   *
   * @param  {Object} selector Selector to filter records.
   * @return {Object}          Merged Selector.
   */
  static _buildSelector(selector) {
    const defaultScope = this.defaultScope;
    const idAlias = s.decapitalize(this.modelName) + 'Id';
    if (_.isObject(selector) && selector._id === undefined &&
      (_.isString(selector.id) || _.isString(selector[idAlias]))) {
      selector._id = selector.id || selector[idAlias];
    }
    delete selector.id;
    delete selector[idAlias];
    return {$and: _.compact(_.flatten([defaultScope, selector]))};
  }

  /**
   * Returns the name of the model.
   *
   * This works even for scopes where the name of the Class
   * is not working cause scopes return anonymous Classes.
   *
   * @return {String} Returns the name of the model.
   */
  static get modelName() {
    return this._modelName || this.name;
  }

  /**
   * This function is used the create scopes.
   *
   * The selector can be passed by options.selector.
   *
   * @param  {Object}     options Pass the selector as part of the options.
   * @return {SmartModel}         An scope returns an anonymous model based on
   *                              its own model with an merged default scope.
   */
  static scope(options) {
    const model = this._getModel(options, this.modelName);
    let defScope = this.defaultScope;
    if (_.isArray(defScope)) {
      defScope = defScope.union(options.selector);
    } else if (_.isObject(defScope)) {
      defScope = [options.selector, defScope];
    } else {
      defScope = options.selector;
    }

    const klass = class extends model {
      static get defaultScope() {
        return defScope;
      }

      static get _modelName() {
        return model.modelName;
      }
    };

    klass.init();

    return klass;
  }

  /**
   * Returns the default scope.
   *
   * All search requests with find, where, all, first and last take care
   * of the default scope.
   *
   * @return {Object} Selector which is used while searching.
   */
  static get defaultScope() {
    return null;
  }

  /**
   * Returns one record which matches the passes selector.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options to set for example the sort of the records.
   * @return {Object}          Returns an instance of SmartModel.
   */
  static find(selector = {}, options = {}) {
    this._applyDefaultSort(options);
    this._applyDefaultTransform(options);
    return this.collection.findOne(this._buildSelector(selector), options);
  }

  /**
   * Queries the database with the passed selector and options.
   *
   * Returns an cursor for reactive queries to the database.
   *
   * @param  {Object}        selector Selector to filter records.
   * @param  {Object}        options  Options to set for example the sort of the records.
   * @return {Meteor.Cursor}          Returns an Meteor Cursor to fetch instances of SmartModel.
   */
  static cursor(selector = {}, options = {}) {
    this._applyDefaultSort(options);
    this._applyDefaultTransform(options);
    return this.collection.find(this._buildSelector(selector), options);
  }

  /**
   * Queries the database with the passed selector and options.
   *
   * Returns an Array of model instances which match the selector.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options to set for example the sort of the records.
   * @return {Array}           Returns an Array of model instances which match the selector.
   */
  static where(selector, options) {
    return this.cursor(selector, options).fetch();
  }

  /**
   * Fetches the count of matching items with selector and options.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options to set for example the sort of the records.
   * @return {Number}          Returns the amount of matching records.
   */
  static count(selector, options) {
    return this.cursor(selector, options).count();
  }

  /**
   * Checks if there is any matching item with selector.
   *
   * @param  {Object}  selector Selector to filter records.
   * @return {Boolean}          Returns true if there is an matching record.
   */
  static hasAny(selector) {
    return this.cursor(selector).count() > 0;
  }

  /**
   * Checks if there is no matching item with selector.
   *
   * @param  {Object}  selector Selector to filter records.
   * @return {Boolean}          Returns true if there is no matching record.
   */
  static isEmpty(selector) {
    return this.cursor(selector).count() === 0;
  }

  /**
   * Fetches the first created record matching selector and options.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options.
   * @return {Object}          Returns an model instance.
   */
  static first(selector, options = {}) {
    options.sort = {createdAt: 1};
    return this.find(selector, options);
  }

  /**
   * Fetches the latest created record matching selector and options.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options.
   * @return {Object}          Returns an model instance.
   */
  static last(selector, options = {}) {
    options.sort = {createdAt: -1};
    return this.find(selector, options);
  }

  /**
   * Iterator to use `for (instance of Model)`
   *
   * @return {Iterator} Returns an Iterator to loop over model.
   */
  static [Symbol.iterator]() {
    return this.all()[Symbol.iterator]();
  }

  /**
   * Queries the database and return all records which matches the current scope.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options to set for example the sort of the records.
   * @return {Array}           Returns an Array of model instances.
   */
  static all(options) {
    return this.where({}, options);
  }

  /**
   * Destroys all records which match the selector and options.
   *
   * @param  {Object} selector Selector to filter records.
   * @param  {Object} options  Options to set for example an limit of records.
   */
  static destroyAll(selector, skipCallbacks) {
    const models = this.where(selector);
    models.map(x => x.destroy(skipCallbacks));
  }

  /**
   * Get schema filled with defaults and belongsTo relations.
   *
   * @return {Object} Schema.
   */
  static getSchema(withTimestamps = false) {
    const schema = this.schema;
    if (!_.isObject(schema)) {
      return {};
    }
    if (withTimestamps === true) {
      schema.createdAt = {type: Number, optional: true};
      schema.updatedAt = {type: Number, optional: true};
    }
    const relations = this.belongsTo;
    if (_.isObject(relations)) {
      for (const name in relations) {
        const relation = relations[name];
        if (!_.isBoolean(relation.optional)) {
          relation.optional = false;
        }
        const foreignKey = (relation.foreignKey || name) + 'Id';
        schema[foreignKey] = {type: String, optional: relation.optional, defaultValue: null};
      }
    }
    return schema;
  }

  /**
   * Overrideable: Get collection name.
   *
   * @return {Strign} Returns custom name of the collection.
   */
  static get collectionName() {
    return null;
  }

  static simpleSchema(withTimestamps) {
    return new SimpleSchema(this.getSchema(withTimestamps));
  }

  /**
   * Overrideable: Schema definition of accepted propierties with
   * optional type and restrictions.
   *
   * @return {Object} Returns custom schema.
   */
  static get schema() {
    return {};
  }

  /**
   * Overriceable: Definition of all belongsTo relations.
   *
   * @return {Object} Returns custom relations.
   */
  static get belongsTo() {
    return {};
  }

  /**
   * Overriceable: Definition of all hasMany relations.
   *
   * @return {Object} Returns custom relations.
   */
  static get hasMany() {
    return {};
  }

  /**
   * Overriceable: Definition of all hasOne relations.
   *
   * @return {Object} Returns custom relations.
   */
  static get hasOne() {
    return {};
  }

  /**
   * Initialize new model instance.
   *
   * @param  {Object} attrs Apply passed attributes to the created instance.
   * @return {Object}       Returns model instance.
   */
  static build(attrs) {
    return new this(attrs);
  }

  /**
   * Initialize and try to save new model instance.
   *
   * @param  {Object} attrs Apply passed attributes to the created instance.
   * @return {Object}       Returns model instance.
   */
  static create(attrs) {
    modelInstance = this.build(attrs);
    return modelInstance.save();
  }

  /**
   * Returns or existing collection with the collection name
   * returned by the collectionName function.
   *
   * @return {Meteor.Collection} Returns Meteor.Collection instance.
   */
  static get collection() {
    const name = this.collectionName || this.modelName;
    let coll = Mongo.Collection.get(name);
    if (!coll) {
      if (this.localCollection === true) {
        coll = new Mongo.Collection(name, {connection: null});
      } else {
        coll = new Mongo.Collection(name);
      }
    }
    return coll;
  }

  /**
   * Allow users to write directly to this collection from client code,
   * subject to limitations you define.
   *
   * @param  {Object} options insert, update, remove functions that look at
   *                          a proposed modification to the database and
   *                          return true if it should be allowed.
   */
  static allow(options) {
    return this.collection.allow(options);
  }

  /**
   * Override allow rules.
   *
   * @param  {Object} options insert, update, remove functions that look at
   *                          a proposed modification to the database and
   *                          return true if it should be denied.
   */
  static deny(options) {
    return this.collection.deny(options);
  }

  /**
   * Apply the default valus from schema.
   */
  _applyDefaults() {
    const schema = this.constructor.getSchema()
    const attrs = this.attributes({add: [], addAttrAccessors: false});
    this.constructor.simpleSchema().clean(attrs);
    for (let column in schema) {
      if (this[column] === undefined && attrs[column] !== undefined) {
        this[column] = attrs[column];
      }
    }
  }

  /**
   * Executes the function with the passed name,
   * unless it was skipped.
   *
   * @param  {String}  name          Name of the callback function.
   * @param  {Array}   skipCallbacks Set this to true to skip all callbacks.
   *                                 Pass an Array of callback names which
   *                                 should be skipped.
   * @return {Boolean}               If the callback was skipped this function
   *                                 retruns true, else the result of the callback.
   */
  _executeCallback(name, skipCallbacks) {
    if (skipCallbacks === true || !_.isFunction(this[name]) ||
      (_.isArray(skipCallbacks) && _.contains(skipCallbacks, name))) {
      return true;
    }
    return this[name]();
  }

  /**
   * Insert arguments do not contain an id
   *
   * @return {Object} Returns the models attributes without id.
   */
  _insertAttributes() {
    return this.attributes({
      add: ['createdAt', 'updatedAt'],
      addAttrAccessors: false,
    });
  }

  /**
   * Update arguments do not contain an id or creation date.
   *
   * @return {Object} Returns the models attributes without id and createdAt.
   */
  _updateAttributes() {
    return this.attributes({
      add: ['updatedAt'],
      addAttrAccessors: false,
    });
  }

  /**
   * Check if the last validation passed or if there are errors.
   * If false is returned check errors for more details what failed.
   *
   * @return {Boolean} Returns if the last validation created errors.
   */
  get isValid() {
    return this.errors.length === 0;
  }

  /**
   * The current status of the record if its already
   * stored at the database.
   *
   * @return {Boolean} Returns true if record is not yet saved.
   */
  get isNew() {
    return this.id === undefined;
  }

  /**
   * The current status of the record if its already
   * stored at the database.
   *
   * @return {Boolean} Returns true if record is saved.
   */
  get isPersistent() {
    return !this.isNew;
  }

  /**
   * Shorthand readonly field to get _id property.
   *
   * @return {String} Returns the same value as _id.
   */
  get id() {
    return this._id;
  }

  /**
   * Get the name of the base class.
   *
   * @return {String} Returns the name of the base class where
   *                  the model is inherited from.
   */
  get itemType() {
    return this.constructor.modelName;
  }

  /**
   * Errors are set by `save`, `create`, `update` and `valudate`.
   * After you called one of this functions you can read the validation errors.
   *
   * @return {Array} Returns an array of objects with the
   *                 properties `column` and `error`
   */
  get errors() {
    return this._errors || [];
  }

  /**
   * Builds an simplte object (not an model instance) of all
   * model properties. You can reduce the number of fields by
   * passing the `pick` property with the options.
   *
   * @param  {Object} options Pass property pick as array of columns
   *                          which should be skipped while building.
   * @return {Object}         Returns simple object (not a model instance)
   *                          with all model properties.
   */
  attributes(options = {}) {
    let {pick, add, addAttrAccessors} = options;
    if (!_.isArray(add)) {
      add = [
        'createdAt',
        'updatedAt',
        'id',
      ];
    }
    if (!_.isBoolean(addAttrAccessors)) {
      addAttrAccessors = true
    }
    if (addAttrAccessors === true) {
      add = _.union(add, this.constructor.attrAccessors);
    }
    let columns = _.keys(this.constructor.getSchema());
    columns = _.union(columns, add);
    if (_.isArray(pick)) {
      columns = _.intersection(columns, pick);
    }

    return _.pick(this, columns);
  }

  /**
   * Run all validations against the columns to check if the current
   * state is valid or not.
   *
   * @param  {Array}   skipCallbacks Set to true to skip all callbacks, or pass
   *                                 an array with all callback names which should
   *                                 be skipped.
   *                                 Possible callbacks are:
   *                                 `beforeValidation`, `afterValidation`
   * @return {Boolean}               Returns if the current model state ist valid or not.
   *                                 Returns false if the validation is stopped by
   *                                 any callback.
   */
  validate(skipCallbacks = false) {
    if (this._executeCallback('beforeValidation', skipCallbacks) === false) {
      return false;
    }
    const attrs = this.attributes({add: [], addAttrAccessors: false});
    this._validationContext.validate(attrs);
    this._errors = this._validationContext.invalidKeys();
    if (this._executeCallback('afterValidation', skipCallbacks) === false) {
      return false;
    }
    return this.isValid;
  }

  /**
   * Sets the timestamps `createdAt` and `updatedAt`.
   * `updatedAt` is allways set, `createdAt` only if not yet present.
   *
   * @return {Object} Returns current model instance.
   */
  touch() {
    if (this.createdAt === undefined) {
      this.createdAt = Date.now();
    }
    this.updatedAt = Date.now();
    return this;
  }

  /**
   * Syncs the current record with the database.
   * Inserts an document if the record is new.
   * Updates the existing record if the record is persistent.
   *
   * @param  {Object}  options                Pass options to skip some actions
   * @param  {Boolean} options.skipValidation Set this to true if you want to allow that
   *                                          an invalid record is saved to the database.
   *                                          (Please handle this with care)
   * @param  {Array}   options.skipCallbacks  Set to true to skip all callbacks, or pass
   *                                          an array with all callback names which should
   *                                          be skipped.
   *                                          Possible callbacks are:
   *                                          `beforeValidation`, `afterValidation`,
   *                                          `beforeSave`, `beforeInsert`, `beforeUpdate`,
   *                                          `afterSave`, `afterInsert`, `afterUpdate`
   * @param  {Boolean} options.skiptouch      Set this to true if you do not want to update
   *                                          the timestamps `createdAt` and `updatedAt`
   * @param  {Boolean} options.skipApplyDefaults Set this to true if you do not want to set
   *                                             undefined properties from the schema to
   *                                             their default values.
   * @return {Object}                         On the server and model instance is returned.
   *                                          If the validation failed the model is initialized.
   *                                          Returns an Promise with the model on the client
   */
  save(options = {}) {
    const {skipValidation, skipCallbacks, skipTouch, skipApplyDefaults} = options;
    this._errors = [];
    let isValid = true
    if (skipApplyDefaults !== true) {
      this._applyDefaults();
    }
    if (skipValidation !== true) {
      isValid = this.validate(skipCallbacks);
    }
    if (this._executeCallback('beforeCommit', skipCallbacks) === false) {
      throw new Meteor.Error('Stopped by beforeCommit');
    }
    if (this._executeCallback('beforeSave', skipCallbacks) === false) {
      throw new Meteor.Error('Stopped by beforeSave');
    }
    if (isValid) {
      if (skipTouch !== true) {
        this.touch();
      }
      if (this.isNew) {
        // insert
        if (this._executeCallback('beforeInsert', skipCallbacks) === false) {
          throw new Meteor.Error('Stopped by beforeInsert');
        }
        const attrs = this._insertAttributes();
        if (Meteor.isServer) {
          this._id = this.constructor.collection.insert(attrs);
          this._executeCallback('afterInsert', skipCallbacks);
          this._executeCallback('afterSave', skipCallbacks);
          this._executeCallback('afterCommit', skipCallbacks);
          return this;
        } else {
          return new Promise((resolve, reject) => {
            this.constructor.collection.insert(attrs, (err, id) => {
              if (err) {
                this._errors = [err];
                return reject(this);
              } else {
                this._id = id;
                this._executeCallback('afterInsert', skipCallbacks);
                this._executeCallback('afterSave', skipCallbacks);
                this._executeCallback('afterCommit', skipCallbacks);
                return resolve(this);
              }
            });
          });
        }
      } else {
        // update
        if (this._executeCallback('beforeUpdate', skipCallbacks) === false) {
          throw new Meteor.Error('Stopped by beforeUpdate');
        }
        const attrs = this._updateAttributes();
        if (Meteor.isServer) {
          this.constructor.collection.update({
            _id: this.id
          }, {
            $set: attrs
          });
          this._executeCallback('afterUpdate', skipCallbacks);
          this._executeCallback('afterSave', skipCallbacks);
          this._executeCallback('afterCommit', skipCallbacks);
          return this;
        } else {
          return new Promise((resolve, reject) => {
            this.constructor.collection.update({
              _id: this.id
            }, {
              $set: attrs
            }, (err, docs) => {
              if (err) {
                this._errors = [err];
                return reject(this);
              } else {
                this._executeCallback('afterUpdate', skipCallbacks);
                this._executeCallback('afterSave', skipCallbacks);
                this._executeCallback('afterCommit', skipCallbacks);
                return resolve(this);
              }
            });
          });
        }
      }
    }
    if (Meteor.isServer) {
      return this;
    } else {
      return new Promise((resolve, reject) => {
        reject(this);
      });
    }
  }

  /**
   * Removed the current model instance from the database.
   *
   * @param  {Array}   skipCallbacks Set to true to skip all callbacks, or pass
   *                                 an array with all callback names which should
   *                                 be skipped.
   *                                 Possible callbacks are:
   *                                 `beforeDestroy`, `afterDestroy`
   * @return {Object}                Returns the current model instance.
   */
  destroy(skipCallbacks) {
    if (this._executeCallback('beforeCommit', skipCallbacks) === false) {
      throw new Meteor.Error('Stopped by beforeCommit');
    }
    if (this._executeCallback('beforeDestroy', skipCallbacks) === false) {
      throw new Meteor.Error('Stopped by beforeDestroy');
    }
    for (const relationName of this.constructor._hasOneDependentDestroy) {
      if (_.isObject(this[relationName])) {
        this[relationName].destroy();
      }
    }
    for (const relationName of this.constructor._hasManyDependentDestroy) {
      this[relationName].all().map(model => model.destroy());
    }
    this.constructor.collection.remove(this.id);
    delete this._id;
    this._executeCallback('afterDestroy', skipCallbacks);
    this._executeCallback('afterCommit', skipCallbacks);
    return this;
  }

  /**
   * Set multiple attributes by passing an object.
   * Only applies properties which are defined at the schema.
   *
   * @param  {Object} attrs Attributes which should be applied.
   * @return {Object}       Returns the current model instance.
   */
  extend(attrs) {
    let columns = _.keys(this.constructor.getSchema(true));
    columns = _.union(columns, this.constructor.attrAccessors);
    _.extend(this, _.pick(attrs, columns));
    return this;
  }

  /**
   * Sets multiple attributes by passing an object,
   * and saves the record afterwards.
   *
   * @param  {Object} attrs   Attributes which should be applied.
   * @param  {Object} options Theese options are passed to the save function.
   *                          See SmartModel#save() for more details.
   * @return {Object}         On the server and model instance is returned.
   *                          If the validation failed the model is initialized.
   *                          Returns an Promise with the model on the client
   */
  update(attrs, options) {
    this.extend(attrs);
    return this.save(options);
  }
}
