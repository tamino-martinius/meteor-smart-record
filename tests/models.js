const base = Meteor.isClient ? window : root;

base.Company = class Company extends SmartModel {
  static hasMany() {
    return {
      users: {}
    }
  }
}

Company.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

base.User = class User extends SmartModel {
  static schema() {
    return {
      username: {type: String, min: 2, max: 20}
    }
  }

  static belongsTo() {
    return {
      company: {optional: true}
    }
  }

  static hasOne() {
    return {
      profile: {dependent: 'destroy'}
    }
  }

  static hasMany() {
    return {
      addresses: {dependent: 'destroy'}
    }
  }
}

User.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

base.Address = class Address extends SmartModel {
  static schema() {
    return {
      street: {type: String, optional: true, defaultValue: ''},
      postalCode: {type: String, optional: true, defaultValue: ''},
      city: {type: String, optional: true, defaultValue: ''},
      country: {type: String, optional: true, defaultValue: 'Germany'},
      note: {type: String, optional: true, defaultValue: ''}
    }
  }

  static belongsTo() {
    return {
      user: {optional: true}
    }
  }
}

Address.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

base.Profile = class Profile extends SmartModel {
  static schema() {
    return {
      gender: {type: String, optional: true, defaultValue: ''},
      firstname: {type: String, optional: true, defaultValue: ''},
      lastname: {type: String, min: 1},
      age: {type: Number, optional: true},
      country: {type: String, optional: true, defaultValue: 'Germany'},
      note: {type: String, optional: true, defaultValue: ''}
    }
  }

  static belongsTo() {
    return {
      user: {optional: true}
    }
  }

  static males() {
    return this.scope({
      selector: {gender: 'male'}
    });
  }

  static females() {
    return this.scope({
      selector: {gender: 'female'}
    });
  }

  static young() {
    return this.scope({
      selector: {age: {$lte: 18}}
    });
  }

  static old() {
    return this.scope({
      selector: {age: {$gt: 18}}
    });
  }

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }
}

Profile.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});
