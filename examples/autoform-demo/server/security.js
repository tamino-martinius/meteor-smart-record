Person.allow({
  insert: function () {
    return true;
  },
  update: function () {
    return true;
  },
  remove: function () {
    return true;
  }
});

Item.allow({
  update: function () {
    return true;
  }
});

PersonWithContacts.allow({
  update: function () {
    return true;
  }
});
