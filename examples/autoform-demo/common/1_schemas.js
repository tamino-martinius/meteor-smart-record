Person = class Person extends SmartModel {
  static schema() {
    return {
      firstName: {
        type: String
      },
      lastName: {
        type: String,
        optional: true
      },
      age: {
        type: Number,
        optional: true
      }
    };
  }
};

Item = class Item extends SmartModel {
  static schema() {
    return {
      name: {
        type: String
      },
      tags: {
        type: String,
        optional: true
      }
    };
  }
};

Select = class Select extends SmartModel {
  static schema() {
    return {
      favoriteYear: {
        type: Number
      }
    }
  }
};

SelectMultiple = class SelectMultiple extends SmartModel {
  static schema() {
    return {
      favoriteYears: {
        type: [Number]
      }
    };
  }
};

FieldsExamples = class FieldsExamples extends SmartModel {
  static get foo() {
    return this.simpleSchema();
  }
  static schema() {
    return {
      name: {
        type: String
      },
      phone: {
        type: String,
        optional: true
      },
      address: {
        type: Object
      },
      'address.street': {
        type: String
      },
      'address.street2': {
        type: String,
        optional: true
      },
      'address.city': {
        type: String
      },
      'address.state': {
        type: String,
        allowedValues: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"],
        autoform: {
          afFieldInput: {
            firstOption: "(Select a State)"
          }
        }
      },
      'address.postalCode': {
        type: String,
        label: "ZIP"
      },
      contacts: {
        type: Array,
        optional: true
      },
      'contacts.$': {
        type: Object
      },
      'contacts.$.name': {
        type: String
      },
      'contacts.$.phone': {
        type: String
      }
    };
  }
};

PersonWithContacts = class PersonWithContacts extends SmartModel {
  static schema() {
    return {
      firstName: {
        type: String
      },
      lastName: {
        type: String,
        optional: true
      },
      age: {
        type: Number,
        optional: true
      },
      contacts: {
        type: Array,
        optional: true
      },
      'contacts.$': {
        type: Object
      },
      'contacts.$.name': {
        type: String
      },
      'contacts.$.phone': {
        type: String
      }
    };
  }
};
