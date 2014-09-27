// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Mongo.Collection("players");

if (Meteor.isClient) {
  Session.setDefault('stolen_points', 0);
  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.leaderboard.stolen_points = function () {
    return Session.get('stolen_points');
  };

  Template.leaderboard.events({
    'click button.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    },
    'click button.steal': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: -5}});
      Session.set('stolen_points', Session.get('stolen_points') + 5);
    },
    'click button.boom': function () {
      Meteor.call('reset', 150);
    },
  });

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.create_player.rendered = function () {
    this.$playerName = this.$('input#chad_rules');
  };

  Template.create_player.events({
    'blur input#chad_rules': function (e, tmpl) {
      Players.insert({
        name: tmpl.$playerName.val(),
        score: Session.get('stolen_points')
      });
      Session.set('stolen_points', 0);
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    },
    'click span.die': function () {
      Players.remove(this._id);
    }
  });
}

Meteor.methods({
  reset: function (x) {
    Players.update({}, {$set: {score: x}}, {multi: true});
  }
});

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Players.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
}
