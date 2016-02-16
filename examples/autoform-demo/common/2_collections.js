var Collections = {
  Person: Person.collection(),
  Item: Item.collection(),
  PersonWithContacts: PersonWithContacts.collection(),
};

Meteor.isClient && Template.registerHelper("Collections", Collections);
