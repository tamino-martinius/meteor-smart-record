Meteor.startup(function () {
  // fixtures
  if (Item.count() === 0) {
    [
      "Hat",
      "Shoes",
      "Coat",
      "Gloves",
      "Socks",
      "Sweater",
      "T-shirt"
    ].map(name => Item.create({name}));
  }

  PersonWithContacts.destroyAll();

  // Used for updatepush example
  PersonWithContacts.create({
    firstName: 'Albert',
    lastName: 'Einstein',
    age: new Date().getFullYear() - 1879
  });

  // Used for updateArrayItem example
  PersonWithContacts.create({
    firstName: 'Winston',
    lastName: 'Churchill',
    age: new Date().getFullYear() - 1874,
    contacts: [
      {name: 'Randolph Churchill', phone: '+1 555-555-5555'},
      {name: 'Jennie Jerome', phone: '+1 555-555-5555'},
      {name: 'Clementine Hozier', phone: '+1 555-555-5555'}
    ]
  });
});
