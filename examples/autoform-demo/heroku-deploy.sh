#!/bin/bash

#change to whichever directory this lives in
cd "$( dirname "$0" )"

#create new git repository and add everything
git init
heroku git:remote -a smart-form-demo
git add .
git commit -m"init"
git remote add heroku git@heroku.com:smart-form-demo.git
heroku buildpacks:set https://github.com/AdmitHub/meteor-buildpack-horse.git
heroku config:set ROOT_URL=https://smart-form-demo.herokuapp.com

#pull heroku but then checkback out our current local master and mark everything as merged
git pull heroku master
git checkout --ours .
git add -u
git commit -m"merged"

#push back to heroku, open web browser, and remove git repository
git push heroku master
heroku open
rm -fr .git

#go back to wherever we started.
cd -
