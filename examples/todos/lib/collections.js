Todos = new Mongo.Collection('todos');

User = class User extends SmartModel {
  static collection() {
    return Meteor.users
  }

  static hasMany() {
    return {
      lists: {dependent: 'destroy'}
    }
  }

  static current() {
    this.find({_id: Meteor.userId()});
  }
}

List = class List extends SmartModel {
  static schema() {
    return {
      name: {type: String, default: this.defaultName},
      incompleteCount: {type: Number, default: 0}
    }
  }

  static belongsTo() {
    return {
      user: {}
    }
  }

  static hasMany() {
    return {
      todos: {dependent: 'destroy'}
    }
  }

  static withName(name) {
    return this.scope({selector: {name: name}});
  }

  static forUser(userId) {
    check(userId, String);
    return this.scope({selector: {userId}});
  }

  static public() {
    return this.scope({selector: {userId: null}});
  }

  static defaultName() {
    let nextLetter = 'A', nextName = 'List ' + nextLetter;
    while (List.withName(nextName).hasAny()) {
      // not going to be too smart here, can go past Z
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      nextName = 'List ' + nextLetter;
    }

    return nextName;
  }

  get isPublic() {
    return !_.isString(this.userId);
  }

  set isPublic(makePublic) {
    if (makePublic === true) {
      this.update({userId: null})
    } else {
      this.update({userId: Meteor.userId()});
    }
  }

  updateIncompleteCount() {
    this.update({incompleteCount: this.todos().incomplete().count()});
  }
}

Todo = class Todo extends SmartModel {
  static schema() {
    return {
      text: {type: String},
      checked: {type: Boolean, default: false}
    }
  }

  static incomplete() {
    return this.scope({selector: {checked: false}});
  }

  static forList(listId) {
    check(listId, String);
    return this.scope({selector: {listId}});
  }

  static belongsTo() {
    return {
      list: {}
    }
  }

  afterCommit() {
    this.list.updateIncompleteCount();
  }
}
