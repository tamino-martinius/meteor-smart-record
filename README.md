# SmartRecord

Rails like models using **ES6**.

Smart Record gives you the ability to:

* Represent **models** and their data.
* Represent **associations** between these models.
* Represent **inheritance** hierarchies through related models.
* **Validate** models before they get persisted to the database.
* Perform database operations in an **object-oriented** fashion.

***Whats next / Currently missing / Where can i contribute***
* Fix **typos**
* Add more **examples**
* Add **property accessors** which are read/write but not stored to the database
* `where`/`all` calls should be cached and refreshed by `reload()`
* `includes` prefetches relations with two db queries *(fetch records => pluck ids => fetch related records by ids)* instead of one query per related model.

  `User.includes({address: {}})`, `Profile.includes({user: {address: {}}})`
* Add **sorting**  to `scopes`
* Add order functions `Profile.males().order({name: 1})`
* Automatically generate `scopes` from schema `Address.findByCountry('Germany')`, `Address.havingCountry('Germany').all()`
* There are already many **tests**, but not every test case is covered.
* Improve the code **documentation**.
* **Migrations**
* Record **versioning**
* Support for **other databases** like Postgres

  I'm currently using **Postgres** with Meteor in production with knex on the server side and minimongo on the client side. This works fine, but the queries on client and server are completely different. An universal model on both sides with the same query language would be perfect.

## TOC
* [Naming Conventions](#naming-conventions)
* [Example](#example)
* [Build/Create records](#build-create-records)
* [Relations](#relations)
  * [Belongs To](#belongs-to)
  * [Has Many](#has-many)
  * [Has One](#has-one)
* [Scopes](#scopes)
  * [Query relative to scope](#query-relative-to-scope)
  * [Build from scope](#build-from-scope)
  * [Scope chaining](#scope-chaining)
* [Searching](#searching)
  * [Find](#find)
  * [Cursor](#cursor)
  * [Where](#where)
  * [Count](#count)
  * [HasAny](#hasany)
  * [IsEMpty](#isempty)
  * [First](#first)
  * [Last](#last)
* [Limit Access](#limit-access)
* [Schema](#schema)
* [Model Name](#model-name)
* [Instance Attributes](#instance-attributes)
  * [isNew](#isnew)
  * [isPersistent](#ispersistent)
  * [id](#id)
  * [itemType](#itemtype)
  * [isValid](#isvalid)
  * [errors](#errors)
  * [attributes](#attributes)
  * [touch](#touch)
  * [save](#save)
  * [destroy](#destroy)
  * [extend](#extend)
  * [update](#update)
* [Custom Attributes](#custom-attributes)
* [Changelog](#changelog)

## Naming Conventions

To keep the configuration as short as possible, its recommended to use the following conventions:

* Everything is in camel case.
  * `createdAt`
  * `someOtherValue`
* Classes should be singular start with an capital letter.
  * `Address`
  * `Chat`
  * `ChatMessage`
* Foreign keys are the class names starting with an lower case character and end with Id.
  * `User` - `userId`
  * `Chat` - `chatId`
  * `ChatMessage` - `chatMessageId`

## Naming Conventions

There is currently no dedicated example, but take a look at `tests/models.js` for some basics.

## Build/Create Records

### Build

Initializes new record from relation while maintaining the current scope.

~~~js
address = Address.build({street: '1st street'});
address.isNew === true;

address = user.addresses().build();
address.userId === user.id;
};
~~~

### Create

Tries to create a new record with the same scoped attributes defined in the relation. Throws an error if callbacks abort creation.

**Server:**
Returns the initialized record if the validation or insert fails.

~~~js
address = Address.create({street: '1st street'});
address.isValid !== address.isNew;
~~~

**Client:**
Returns a `Promise` which returns the created record on success or the initialized if sth. goes wrong.

~~~js
Address.create({
  street: '1st street'
}).then(function(address){
  address.isNew === false;
}).catch(function(address){
  address.isNew === true;
});
~~~

## Relations

### Belongs To

~~~js
Address = class Address extends SmartModel {
  static belongsTo() {
    return {
      user: {}
    }
  }
};

address = Address.create({userId: id});
user = address.user;

address = Address.build();
address.user = user;
address.userId === user.id;
~~~

### Has Many

~~~js
User = class User extends SmartModel {
  static hasMany() {
    return {
      addresses: {}
    }
  }
};

user.addresses().all();
address = user.addresses().create();

User = class User extends SmartModel {
  static hasMany() {
    return {
      addresses: {dependent: 'destroy'}
    }
  }
};
~~~

### Has One

~~~js
User = class User extends SmartModel {
  static hasOne() {
    return {
      profile: {}
    }
  }
};

user.profile;

User = class User extends SmartModel {
  static hasOne() {
    return {
      profile: {dependent: 'destroy'}
    }
  }
};
~~~

## Scopes

### Create

~~~js
Profile = class Profile extends SmartModel {
  static males() {
    return this.scope({selector: {gender: 'male'}});
  }

  static females() {
    return this.scope({selector: {gender: 'female'}});
  }

  static young() {
    return this.scope({selector: {age: {$lte: 18}}});
  }

  static old() {
    return this.scope({selector: {age: {$gt: 18}}});
  }

  static withName(name) {
    return this.scope({selector: {name: name}});
  }
}
~~~

### Query relative to scope

~~~js
Profile.males().all();
Profile.males().where({age: 21});
~~~

### Build from scope

~~~js
profile = Profile.males().build();
profile.gender === 'male';
~~~

### Scope chaining

~~~js
Profile.males().young();
Profile.males().young().where({});
~~~

## Searching

Queries are allways relative to the parent scopes and the own default scope.

### Find

Retruns one matching record (equivalent to findOne from Meteor.Collection).

~~~js
Address.find(selector, options);
Profile.males().young().find(selector, options);
~~~

### Cursor

Retruns an cursor (equivalent to find from Meteor.Collection).

~~~js
Address.cursor(selector, options);
Profile.males().young().cursor(selector, options);
~~~

### Where

Retruns an array of records (equivalent to find.fetch from Meteor.Collection).

~~~js
Address.where(selector, options);
Profile.males().young().where(selector, options);
~~~

### Count

Retruns the count of the matching records (equivalent to find.count from Meteor.Collection).

~~~js
Address.count(selector, options);
Profile.males().young().count(selector, options);
~~~

### HasAny

Checks if there is any matching item with selector.

~~~js
Address.hasAny(selector);
Profile.males().young().hasAny(selector);
~~~

### IsEmpty

Checks if there is no matching item with selector.

~~~js
Address.isEmpty(selector);
Profile.males().young().isEmpty(selector);
~~~

### First

Retruns the first matching record regarding the creation order.

~~~js
Address.first(selector, options);
Profile.males().young().first(selector, options);
~~~

### Last

Retruns the last matching record regarding the creation order.

~~~js
Address.last(selector, options);
Profile.males().young().last(selector, options);
~~~

### Schema

Define the writeable columns and types.

Possible options: `type`, `default`, `required`, `minLength`, `maxLength`, `minNumber`, `maxNumber`

~~~js
Address = class Address extends SmartModel {
  static schema() {
    return {
      street: {type: String, default: ''},
      postalCode: {type: String, default: ''},
      city: {type: String, default: '', required: true, minLength: 1},
      country: {type: String, default: 'Germany'},
      note: {type: String, default: ''}
    }
  }
}
~~~

## Model Name

The class name (model.name) is set automatically while defining a Class. Scopes return a anonymous Class. Please get the model/Class name with this function.

~~~js
Profile.modelName() === Profile.males().modelName(); // = Profile
Profile.name !== Profile.males().name; // = _class
~~~

## Instance Attributes

### isNew

~~~js
address = Address.build();
address.isNew === true;
address.save();
address.isNew === false;
~~~

### isPersistent

~~~js
address = Address.build();
address.isPersistent === false;
address.save();
address.isPersistent === true;
~~~

### id

Even when MongoDB is using _id as property saving the identifier. With `id` you can allways access `_id`.

~~~js
address.id === address._id;
~~~

### itemType

The itemType is the same as modelName - just on an instance level.

~~~js
Profile.first().itemType === Profile.males().first().itemType;
~~~

### isValid

Returns true if record is valid.

*Please note:* isValid is only set after calling `save`, `update`, `validate` or `create`.

~~~js
address.isValid === true;
address.save();
address.isValid === true;
delete address.requiredField;
address.isValid === true;
address.validate();
address.isValid === false;
~~~

### errors

Errors are set by `save` and `valudate`. After you called one of this functions you can read the validation errors.

~~~js
profile = Profile.save();
profile.errors === [{
    column: 'lastname', error: 'required'
}];
~~~

### attributes

Returns an object which contains all properties. You can pick several columns by passing the `pick` options.

~~~js
address.attributes() === {
  street: "1st street",
  city: "New York",
  country: "USA"
};
address.attributes({pick: ['street']}) === {
  street: "1st street"
};
~~~

### touch

Sets the createdAt field to the current time if not yet set and allways sets the updatedAt propierty to now.

~~~js
address = Address.build();
address.createdAt === address.updatedAt === undefined;
address.touch();
address.createdAt === address.updatedAt !== undefined;
address.touch();
address.createdAt !== address.updatedAt;
~~~

### save

Saves the record unless validation failes or an before callback breaks the call.


options:
* `skipValidation` skips validation if present
* `skipCallbacks` skip all callbacks or just specific ones
* `skipTouch` do not update timestamps
* `skipApplyDefaults` do not apply the default values

**Server:**
Returns the initialized record if the validation or insert fails.

~~~js
address = Address.build({street: '1st street'});
address.save();
address.save({skipValidation: true});
~~~

**Client:**
Returns a `Promise` which returns the created record on success or the initialized if sth. goes wrong.

~~~js
address = Address.build({street: '1st street'});
address.save().then(function(address){
  address.isNew === false;
}).catch(function(address){
  address.isNew === true;
});
~~~

### destroy

Destroys the current model instance.

~~~js
Address.count({_id: address.id}) === 1;
address.destroy();
Address.count({_id: address.id}) === 0;
~~~

### extend

Sets multiple attributes by passing an object.

~~~js
address.extend({
  street: "1st street",
  city: "New York",
  country: "USA"
});
~~~

### update

Sets multiple attributes by passing an object, and saves the record afterwards.

~~~js
address.update({
  street: "1st street",
  city: "New York",
  country: "USA"
});
~~~

### Custom Attributes

~~~js
Profile = class Profile extends SmartModel {
  static schema() {
    return {
      firstname: {type: String},
      lastname: {type: String}
    }
  }

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }
}

profile = Profile.build({
  firstname: 'Foo',
  lastname: 'Bar'
});
profile.name === 'Foo Bar';
~~~

## Changelog

`0.0.3` `2016-02-10`

* Has Many scopes are now functions instead of properties to be consistent with custom scopes.
* Added todos example.
* Added functions for default values:

  ~~~js
  List = class List extends SmartModel {
    static schema() {
      return {
        name: {default: this.defaultName}
      }
    }

    static defaultName() {
      // ...
    }
  }
  ~~~
* Added `dependent: 'destroy'` for `hasOne` and `hasMany` relations.
* Added callbacks on `save`, `update`, `create`, `destroy`:
  * `beforeCommit`
  * `afterCommit`
* New functions:
  * `.hasAny(selector)`
  * `.isEmpty(selector)`

`0.0.2` `2016-02-09` Released package on atmosphere

`0.0.1` `2016-02-09` Initial commit with the following functions:

* `.modelName()`
* `.scope(options)`
* `.defaultScope()`
* `.build(attrs)`
* `.create(attrs)`
* `.find(selector, options)`
* `.cursor(selector, options)`
* `.where(selector, options)`
* `.count(selector, options)`
* `.first(selector, options)`
* `.last(selector, options)`
* `.all(options)`
* `.destroyAll(selector, options)`
* `.getSchema()`
* `.collection()`
* `.allow()`
* `.deny()`
* `.collectionName()` *overrideable*
* `.schema()` *overrideable*
* `.belongsTo()` *overrideable*
* `.hasMany()` *overrideable*
* `.hasOne()` *overrideable*
* `#isValid`
* `#isNew`
* `#isPersistent`
* `#id`
* `#itemType`
* `#errors`
* `#attributes(options)`
* `#validate(skipCallbacks)`
* `#touch()`
* `#save(options)`
* `#destroy(skipCallbacks)`
* `#extend(attrs)`
* `#update(attrs, options)`
