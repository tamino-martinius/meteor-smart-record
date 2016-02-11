// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Player = class Player extends SmartModel {
  static schema() {
    return {
      name: {type: String},
      score: {type: Number, default: () => _.random(10) * 5}
    }
  }

  set isSelected(value) {
    Session.set('selectedPlayer', value === true ? this.id : null);
  }

  get isSelected() {
    return this.id === Session.get("selectedPlayer");
  }

  increaseScore() {
    this.update({score: this.score + 5});
  }
};

if (Meteor.isClient) {
  Template.leaderboard.helpers({
    players: function () {
      return Player.all({sort: {score: -1, name: 1}});
    }
  });

  Template.player.events({
    'click li': function () {
      this.isSelected = !this.isSelected;
    },
    'click button': function () {
      this.increaseScore();
    }
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Player.count() === 0) {
      [
        "Ada Lovelace",
        "Grace Hopper",
        "Marie Curie",
        "Carl Friedrich Gauss",
        "Nikola Tesla",
        "Claude Shannon"
      ].map(name => Player.create({name}));
    }
  });
}
