Template.updateArrayItem.helpers({
  exampleDoc: function () {
    return PersonWithContacts.find({firstName: 'Winston'});
  }
});
