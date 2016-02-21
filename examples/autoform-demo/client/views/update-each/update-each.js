Template["updateEach"].helpers({
  items: function () {
    return Item.all({sort: {name: 1}});
  },
  makeUniqueID: function () {
    return "update-each-" + this._id;
  }
});