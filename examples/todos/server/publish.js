Meteor.publish('publicLists', function() {
  return List.public().cursor();
});

Meteor.publish('privateLists', function() {
  if (this.userId) {
    return List.forUser(this.userId).cursor();
  } else {
    return this.ready();
  }
});

Meteor.publish('todos', function(listId) {
  return Todo.forList(listId).cursor();
});
