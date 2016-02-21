Template.updatepush.helpers({
  exampleDoc: function () {
    return PersonWithContacts.find({firstName: 'Albert'});
  }
});
