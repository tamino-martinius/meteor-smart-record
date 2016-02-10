let context, it;

reset = function() {
  Company.destroyAll();
  User.destroyAll();
  Profile.destroyAll();
  Address.destroyAll();
};

group = function(name, fn) {
  Tinytest.add(name, (test) => {
    reset();
    fn(test);
  });
};

const Fiber = Npm.require('fibers');

sleep = function(ms) {
  var fiber = Fiber.current;
  setTimeout(function() {
      fiber.run();
  }, ms);
  Fiber.yield();
};


// class functions

group('SmartModel.build()', (test) => {
  const address = Address.build({
    street: 'a',
    foo: 'bar'
  });

  it = 'returns street passed while build';
  test.equal(address.street, 'a', it);

  it = 'does not return properties which are not in the schema';
  test.isUndefined(address.foo, it);

  it = 'returns an instance of the model';
  test.instanceOf(address, Address, it);

  it = 'returns a new record';
  test.isTrue(address.isNew, it);

  it = 'returns an not persistent record';
  test.isFalse(address.isPersistent, it);
});

group('SmartModel.create()', (test) => {
  const address = Address.create();

  it = 'returns an record which is not new';
  test.isFalse(address.isNew, it);

  it = 'returns an persistent record';
  test.isTrue(address.isPersistent, it);
});

group('SmartModel.modelName()', (test) => {
  it = 'returns an name equal to the name of the class';
  {
    const model = class Foo extends SmartModel {};
    test.equal(model.modelName(), 'Foo', it);
  }

  it = 'returns the private model name if present';
  {
    const model = class Foo extends SmartModel {
      static get _modelName() {
        return 'Bar';
      }
    };
    test.equal(model.modelName(), 'Bar', it);
  }
});

group('SmartModel.belongsTo()', (test) => {
  const address = Address.build({userId: 'a'});

  it = 'adds the foreign keys automatically to the schema';
  test.equal(address.userId, 'a', it);

  it = 'creates an setter for the relation';
  {
    address.user = {id: 'b'};
    test.equal(address.userId, 'b', it);
  }

  context = 'when there is an user';
  {
    user = User.create({username: 'username'});
    test.isTrue(user.isPersistent, context);

    it = 'can set relation with model instance';
    {
      address.user = user;
      test.equal(address.userId, user.id, 'foreignKey is set by relation');
    }

    it = 'returns user through relation';
    {
      test.isNotNull(address.user, it);
      test.isNotUndefined(address.user, it);
      test.equal(address.user.id, user.id, it);
    }
  }
});

group('SmartModel.hasMany()', (test) => {
  context = 'when there is an user';
  {
    const user = User.create({username: 'username'});
    test.isTrue(user.isPersistent, context);

    context = 'when there is an non related address';
    {
      const address = Address.create();
      test.isTrue(address.isPersistent, context);

      it = 'does not return the address through relation';
      test.equal(user.addresses.count(), 0, it);

      context = 'when there are multiple related addresses';
      {
        const address1 = Address.create({userId: user.id});
        const address2 = Address.create({userId: user.id});
        test.isTrue(address1.isPersistent, context);
        test.isTrue(address2.isPersistent, context);

        it = 'retrun the addresses related to the user';
        {
          test.equal(user.addresses.count(), 2, it);
          test.equal(user.addresses.first().id, address1.id, it);
          test.equal(user.addresses.last().id, address2.id, it);
        }
      }
    }
  }
});

group('SmartModel.hasOne()', (test) => {
  context = 'when there is an user';
  {
    const user = User.create({username: 'username'});
    test.isTrue(user.isPersistent, context);

    it = 'does not retrun an profile for this user';
    test.isUndefined(user.profile, it);

    context = 'when there is an non related profile';
    {
      const someOtherProfile = Profile.create({lastname: 'test'});
      test.isTrue(someOtherProfile.isPersistent, context);

      it = 'does not retrun an profile for this user';
      test.isUndefined(user.profile, it);

      context = 'when there is an related profile';
      {
        const profile = Profile.create({userId: user.id, lastname: 'test'});
        test.isTrue(profile.isPersistent, context);

        it = 'returns the related profile';
        {
          test.isNotUndefined(user.profile);
          test.equal(user.profile.id, profile.id, it);
        }
      }
    }
  }
});

group('SmartModel.scope()', (test) => {
  context = 'when there are multiple profiles';
  {
    const profile = Profile.create({lastname: 'test'});
    const youngMale = Profile.create({
      lastname: 'test',
      gender: 'male',
      age: 10
    });
    const youngFemale = Profile.create({
      lastname: 'test',
      gender: 'female',
      age: 10
    });
    const oldMale = Profile.create({
      lastname: 'test',
      gender: 'male',
      age: 40
    });
    const oldFemale = Profile.create({
      lastname: 'test',
      gender: 'female',
      age: 40
    });
    let testedScope = Profile;
    returnedIds = function() {
      return testedScope.all().map(x => x.id);
    };
    count = function() {
      return testedScope.count();
    };
    test.equal(count(), 5, context);

    it = 'returns just matching records for the scope';
    {
      testedScope = Profile.males();
      test.equal(count(), 2, it);
      test.include(returnedIds(), youngMale.id, it);
      test.include(returnedIds(), oldMale.id, it);
    }

    it = 'returns the same records if the same scope is multiple times';
    {
      testedScope = Profile.males().males();
      test.equal(count(), 2, it);
      test.include(returnedIds(), youngMale.id, it);
      test.include(returnedIds(), oldMale.id, it);
    }

    it = 'returns matching records for complex queries';
    {
      testedScope = Profile.young();
      test.equal(count(), 2, it);
      test.include(returnedIds(), youngMale.id, it);
      test.include(returnedIds(), youngFemale.id, it);
    }

    it = 'returns records witch matches all scopes when chaining them';
    {
      testedScope = Profile.young().females();
      test.equal(count(), 1, it);
      test.include(returnedIds(), youngFemale.id, it);
    }

    it = 'returns records which matches scope and queries when searching within scope';
    {
      test.equal(Profile.young().count({gender: 'female'}), 1, it);
      test.equal(Profile.young().find({gender: 'female'}).id, youngFemale.id, it);
    }

    it = 'returns no records when chained scopes do not overlap';
    {
      testedScope = Profile.males().females();
      test.equal(count(), 0, 'Count equals 0');
    }
  }
});

group('SmartModel.find()', (test) => {
  let selector, options;
  const subject = function() {
    return Address.find(selector, options);
  }

  it = 'does not return an record';
  test.isUndefined(subject(), it);

  context = 'when there is an record';
  {
    const address = Address.create();
    test.isTrue(address.isPersistent, context);

    it = 'returns the record';
    test.equal(subject().id, address.id, it);

    context = 'when there is another address';
    {
      const anotherAddress = Address.create();
      test.isTrue(anotherAddress.isPersistent, context);

      it = 'returns some record';
      test.isTrue(subject().id === address.id || subject().id === anotherAddress.id, it);
    }
  }

  reset();

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);

    context = 'when an selector is present';
    {
      selector = {street: 'b'};

      it = 'returns the matching record';
      test.equal(subject().id, address2.id, it);

      selector = undefined; //reset
    }

    context = 'when options are present';
    {
      options = {sort: {createdAt: 1}};

      it = 'takes care of sort option';
      test.equal(subject().id, address1.id, it);
    }
  }
});

group('SmartModel.cursor()', (test) => {
  let selector, options;
  const subject = function() {
    return Address.cursor(selector, options);
  }
  const count = function() {
    return subject().count();
  }
  const returnedIds = function() {
    return subject().fetch().map(x => x.id);
  }

  it = 'does not return an record';
  test.equal(count(), 0, it);

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);

    it = 'returns cursor to all records';
    test.equal(count(), 3, it);

    context = 'when an selector is present';
    {
      selector = {street: {$gt: 'a'}};

      it = 'returns cursor to all matching records';
      {
        test.equal(count(), 2, it);
        test.include(returnedIds(), address2.id);
        test.include(returnedIds(), address3.id);
      }

      selector = undefined; //reset
    }

    context = 'when options are present';
    {
      options = {sort: {createdAt: 1}};

      it = 'takes care of sort option';
      test.equal(returnedIds()[0], address1.id, it);
    }
  }
});

group('SmartModel.where()', (test) => {
  let selector, options;
  const subject = function() {
    return Address.where(selector, options);
  }
  const returnedIds = function() {
    return subject().map(x => x.id);
  }

  it = 'does not return an record';
  test.length(subject(), 0, it);

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);

    it = 'returns cursor to all records';
    test.length(subject(), 3, it);

    context = 'when an selector is present';
    {
      selector = {street: {$gt: 'a'}};

      it = 'returns cursor to all matching records';
      {
        test.length(subject(), 2, it);
        test.include(returnedIds(), address2.id);
        test.include(returnedIds(), address3.id);
      }

      selector = undefined; //reset
    }

    context = 'when options are present';
    {
      options = {sort: {createdAt: 1}};

      it = 'takes care of sort option';
      test.equal(returnedIds()[0], address1.id, it);
    }
  }
});

group('SmartModel.count()', (test) => {
  let selector, options;
  const subject = function() {
    return Address.count(selector, options);
  }

  it = 'returns 0';
  test.equal(subject(), 0, it);

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);

    it = 'retruns the count of all records';
    test.equal(subject(), 3, it);

    context = 'when an selector is present';
    {
      selector = {street: {$gt: 'a'}};

      it = 'retruns the count of matching records';
      {
        test.equal(subject(), 2, it);
      }
    }

    context = 'when an selector does not match anything';
    {
      selector = {street: 'foo'};

      it = 'retruns 0';
      {
        test.equal(subject(), 0, it);
      }
    }
  }
});

group('SmartModel.first()', (test) => {
  let selector, options;
  const subject = function() {
    return Address.first(selector, options);
  }

  it = 'does not return an record';
  test.isUndefined(subject(), it);

  context = 'when there is an record';
  {
    const address = Address.create();
    test.isTrue(address.isPersistent, context);

    it = 'returns the record';
    test.equal(subject().id, address.id, it);

    context = 'when there is another address';
    {
      const anotherAddress = Address.create();
      test.isTrue(anotherAddress.isPersistent, context);

      it = 'returns the first record';
      test.equal(subject().id, address.id, it);
    }
  }

  reset();

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);

    context = 'when an selector is present';
    {
      selector = {street: 'b'};

      it = 'returns the matching record';
      test.equal(subject().id, address2.id, it);

      selector = undefined; //reset
    }
  }
});

group('SmartModel.last()', (test) => {
  let selector, options;
  const subject = function() {
    return Address.last(selector, options);
  }

  it = 'does not return an record';
  test.isUndefined(subject(), it);

  context = 'when there is an record';
  {
    const address = Address.create();
    test.isTrue(address.isPersistent, context);

    it = 'returns the record';
    test.equal(subject().id, address.id, it);

    context = 'when there is another address';
    {
      const anotherAddress = Address.create();
      test.isTrue(anotherAddress.isPersistent, context);

      it = 'returns the last record';
      test.equal(subject().id, anotherAddress.id, it);
    }
  }

  reset();

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);

    context = 'when an selector is present';
    {
      selector = {street: 'b'};

      it = 'returns the matching record';
      test.equal(subject().id, address2.id, it);

      selector = undefined; //reset
    }
  }
});

group('SmartModel.destroyAll()', (test) => {
  it = 'does not do anything when there is no record';
  Address.destroyAll();
  test.ok(it);

  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);
    test.equal(Address.count(), 3, context);

    it = 'removes all records';
    {
      Address.destroyAll();
      test.equal(Address.count(), 0, context);
    }
  }
});


// instance functions

group('SmartModel#isNew', (test) => {
  let model;
  const subject = function() {
    return model.isNew;
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'returns true';
    test.isTrue(subject(), it);

    model.save();

    it = 'returns false';
    test.isFalse(subject(), it);
  }
});

group('SmartModel#isPersistent', (test) => {
  let model;
  const subject = function() {
    return model.isPersistent;
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'returns false';
    test.isFalse(subject(), it);

    model.save();

    it = 'returns true';
    test.isTrue(subject(), it);
  }
});

group('SmartModel#isValid', (test) => {
  let model;
  const subject = function() {
    return model.isValid;
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'returns true';
    test.isTrue(subject(), it);

    model._errors = [1];

    it = 'returns false';
    test.isFalse(subject(), it);
  }
});

group('SmartModel#id', (test) => {
  let model;
  const subject = function() {
    return model.id;
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'is undefined';
    test.isUndefined(subject(), it);

    model.save();

    it = 'returns the _id of the model';
    test.equal(subject(), model._id, it);
  }
});

group('SmartModel#itemType', (test) => {
  let model;
  const subject = function() {
    return model.itemType;
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'returns the name of the model';
    test.equal(subject(), 'Address', it);
  }

  context = 'when the model has a different model name';
  {
    model = (
      class Foo extends SmartModel {
        static get _modelName() {
          return 'Bar';
        }
      }
    ).build();

    it = 'returns the model name';
    test.equal(subject(), 'Bar', it);
  }
});

group('SmartModel#errors', (test) => {
  let model;
  const subject = function() {
    return model.errors;
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'returns empty array';
    test.length(subject(), 0, it);

    model._errors = [1];

    it = 'returns the errors';
    test.length(subject(), 1, it);
  }
});

group('SmartModel#attributes()', (test) => {
  let model, options, expectation;
  const subject = function() {
    return model.attributes(options);
  }

  context = 'when a new model is build';
  {
    model = Address.build();

    it = 'returns an object with all applied default values';
    {
      expectation = {
        street: '',
        postalCode: '',
        city: '',
        country: 'Germany',
        note: '',
        userId: null,
        id: undefined
      };
      test.isTrue(_.isEqual(subject(), expectation), it);
    }

    context = 'when picking several columns';
    {
      options = {pick: ['street']};
      expectation = {
        street: ''
      };
      test.isTrue(_.isEqual(subject(), expectation), it);
    }

    context = 'when picking columns which are not within the schema';
    {
      options = {pick: ['street', 'foo']};
      expectation = {
        street: ''
      };
      test.isTrue(_.isEqual(subject(), expectation), it);
    }

    context = 'when picking additional columns';
    {
      model.save();
      options = {add: ['createdAt']};
      expectation = {
        createdAt: model.createdAt,
        street: '',
        postalCode: '',
        city: '',
        country: 'Germany',
        note: '',
        userId: null
      };
      test.isTrue(_.isEqual(subject(), expectation), it);
    }
  }
});

group('SmartModel#validate()', (test) => {
  let model;

  context = 'when a new model is created';
  {
    it = 'sets the errors while creating';
    {
      model = Profile.build();
      model.save();
      test.length(model.errors, 2, it);
    }

    it = 'is one error less when lastname is present';
    {
      model.lastname = '';
      model.save();
      test.length(model.errors, 1, it);
    }

    it = 'returns no error if lastname is valid';
    {
      model.lastname = 'foo';
      model.save();
      test.length(model.errors, 0, it);
    }
  }
});

group('SmartModel#touch()', (test) => {
  context = 'when a new model is build';
  {
    const model = Address.build();

    it = 'has no createdAt and updatedAt is defined';
    {
      test.isUndefined(model.createdAt, it);
      test.isUndefined(model.updatedAt, it);
    }

    context = 'when model is touched';
    {
      model.touch();
      const createdAt = model.createdAt;
      const updatedAt = model.updatedAt;

      it = 'sets the timestamps';
      {
        test.isNotUndefined(model.createdAt, it);
        test.isNotUndefined(model.updatedAt, it);
      }

      model.touch();
      sleep(100);

      it = 'does not change createdAt';
      test.equal(model.createdAt, createdAt, it);

      it = 'changes updatedAt';
      test.notEqual(model.updatedAt, updatedAt, it);
    }
  }
});

group('SmartModel#save()', (test) => {
  context = 'when a new model is build';
  {
    const model = Address.build();
    test.isTrue(model.isNew, it);

    context = 'when saving the record';
    {
      model.save();

      it = 'saves the record';
      test.isFalse(model.isNew, it);
    }
  }
});

group('SmartModel#destroy()', (test) => {
  context = 'when there are some records';
  {
    const address1 = Address.create({street: 'a'});
    const address2 = Address.create({street: 'b'});
    const address3 = Address.create({street: 'c'});
    test.isTrue(address1.isPersistent, context);
    test.isTrue(address2.isPersistent, context);
    test.isTrue(address3.isPersistent, context);
    test.equal(Address.count(), 3, context);

    it = 'removes the record';
    {
      address1.destroy();
      test.equal(Address.count(), 2, context);
    }
  }
});

group('SmartModel#extend()', (test) => {
  const address = Address.build();

  it = 'assigns multiple properties at once';
  {
    address.extend({
      street: 'a',
      city: 'b'
    })
    test.equal(address.street, 'a', it);
    test.equal(address.city, 'b', it);
  }

  it = 'does not assign properties which are not within the schema';
  {
    address.extend({
      foo: 'bar'
    })
    test.isUndefined(address.foo, it);
  }
});

group('SmartModel#update()', (test) => {
  const address = Address.build();

  it = 'is not saved';
  test.isTrue(address.isNew, it);

  context = 'when updating the record';
  {
    address.update({
      street: 'a',
      foo: 'bar'
    })

    it = 'assigns the attributes and saves the record';
    {
      test.isFalse(address.isNew, it);
      test.equal(address.street, 'a', it);
      test.isUndefined(address.foo, it);
    }
  }
});
