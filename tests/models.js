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
      username: {type: String, required: true, minLength: 2, maxLength: 20}
    }
  }

  static belongsTo() {
    return {
      company: {}
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
      street: {type: String, default: ''},
      postalCode: {type: String, default: ''},
      city: {type: String, default: ''},
      country: {type: String, default: 'Germany'},
      note: {type: String, default: ''}
    }
  }

  static belongsTo() {
    return {
      user: {}
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
      gender: {type: String},
      firstname: {type: String},
      lastname: {type: String, required: true, minLength: 1},
      age: {type: Number},
      country: {type: String, default: 'Germany'},
      note: {type: String, default: ''}
    }
  }

  static belongsTo() {
    return {
      user: {}
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
