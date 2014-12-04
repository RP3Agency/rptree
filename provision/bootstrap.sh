#!/usr/bin/env bash

# Update variables here. We'll get to them later in the script.

# Database
# MONGODB_PASS=



# Now go forth and provision...

echo "Installing Node and npm"
apt-get update >/dev/null 2>&1
apt-get install -y software-properties-common python-software-properties >/dev/null 2>&1
apt-get install -y python g++ make >/dev/null 2>&1
add-apt-repository -y ppa:chris-lea/node.js >/dev/null 2>&1
apt-get update >/dev/null 2>&1
apt-get install -y nodejs >/dev/null 2>&1

echo "Installing Ruby"
apt-get install -y ruby-full build-essential >/dev/null 2>&1
apt-get install -y rubygems >/dev/null 2>&1

echo "Installing Bundler"
gem install bundler >/dev/null 2>&1

echo "Installing Sass and other Sass-related things via Bundler"
cd /vagrant # Let's just make doubly sure we're in the correct directory
sudo -u vagrant bundle install >/dev/null 2>&1

echo "Installing gulp globally"
npm install gulp -g >/dev/null 2>&1

echo "Installing Local Packages"
cd /vagrant
npm install >/dev/null 2>&1

echo "Installing vim..."
apt-get install -y vim >/dev/null 2>&1
