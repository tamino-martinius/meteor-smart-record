// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
  if (List.isEmpty()) {
    var data = [
      {name: "Meteor Principles",
       items: ["Data on the Wire",
         "One Language",
         "Database Everywhere",
         "Latency Compensation",
         "Full Stack Reactivity",
         "Embrace the Ecosystem",
         "Simplicity Equals Productivity"
       ]
      },
      {name: "Languages",
       items: ["Lisp",
         "C",
         "C++",
         "Python",
         "Ruby",
         "JavaScript",
         "Scala",
         "Erlang",
         "6502 Assembly"
         ]
      },
      {name: "Favorite Scientists",
       items: ["Ada Lovelace",
         "Grace Hopper",
         "Marie Curie",
         "Carl Friedrich Gauss",
         "Nikola Tesla",
         "Claude Shannon"
       ]
      }
    ];

    data.map((listSeed) => {
      const list = List.create({name: listSeed.name});
      listSeed.items.map(text => list.todos().create({text}));
    });
  }
});
