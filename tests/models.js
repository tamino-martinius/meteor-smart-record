global.Company = class Company extends SmartModel {
  static get hasMany() {
    return {
      accounts: {}
    }
  }
}

Company.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

global.Account = class Account extends SmartModel {
  static get schema() {
    return {
      username: {type: String, min: 2, max: 20}
    }
  }

  static get belongsTo() {
    return {
      company: {optional: true}
    }
  }

  static get hasOne() {
    return {
      profile: {dependent: 'destroy'}
    }
  }

  static get hasMany() {
    return {
      addresses: {dependent: 'destroy'}
    }
  }
}

Account.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

global.Address = class Address extends SmartModel {
  static get schema() {
    return {
      street: {type: String, optional: true, defaultValue: ''},
      postalCode: {type: String, optional: true, defaultValue: ''},
      city: {type: String, optional: true, defaultValue: ''},
      country: {type: String, optional: true, defaultValue: 'Germany'},
      note: {type: String, optional: true, defaultValue: ''}
    }
  }

  static get belongsTo() {
    return {
      account: {optional: true}
    }
  }
}

Address.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

global.Profile = class Profile extends SmartModel {
  static get schema() {
    return {
      gender: {type: String, optional: true, defaultValue: ''},
      firstname: {type: String, optional: true, defaultValue: ''},
      lastname: {type: String, min: 1},
      age: {type: Number, optional: true},
      country: {type: String, optional: true, defaultValue: 'Germany'},
      note: {type: String, optional: true, defaultValue: ''}
    }
  }

  static get belongsTo() {
    return {
      account: {optional: true}
    }
  }

  static get males() {
    return this.scope({
      selector: {gender: 'male'}
    });
  }

  static get females() {
    return this.scope({
      selector: {gender: 'female'}
    });
  }

  static get young() {
    return this.scope({
      selector: {age: {$lte: 18}}
    });
  }

  static get old() {
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
