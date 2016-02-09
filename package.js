Package.describe({
  name: "zaku:smart-record",
  summary: "Rails like models using ES6.",
  version: "0.0.2",
  git: "https://github.com/tamino-martinius/meteor-smart-record.git"
});

c = 'client';
s = 'server';
cs = [c, s];

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2.1");
  api.use('mongo'                                   , cs);
  api.use('dburles:mongo-collection-instances@0.1.3', cs);
  api.use('dburles:eslint@1.0.1'                    , cs);
  api.use('underscorestring:underscore.string@3.2.3', cs);
  api.use('underscore'                              , cs);
  api.use('ecmascript'                              , cs);

  api.addFiles('lib/smart_model.js'                 , cs);

  api.export('SmartModel'                           , cs);
});

Package.onTest(function (api) {
  api.use('insecure'                                ,  s);
  api.use('tinytest'                                ,  s);
  api.use('ecmascript'                              ,  s);
  api.use('underscore'                              ,  s);
  api.use('dburles:eslint@1.0.1'                    ,  s);
  api.use('zaku:smart-record'                       ,  s);

  api.add_files('tests/models.js'                   ,  s);
  api.add_files('tests/smart_model_tests.js'        ,  s);
});
