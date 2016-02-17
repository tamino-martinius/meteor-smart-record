Meteor.publish(null, function () {
  return [
    Person.cursor(),
    PersonWithContacts.cursor()
  ];
});

Meteor.publish("allItems", function () {
  return Item.cursor();
});
