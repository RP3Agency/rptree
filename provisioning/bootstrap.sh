#!/usr/bin/env bash

# Ubuntu release
RELEASE=$1

if [[ $2 == "false" ]]; then
	# Ignore mirrors completely
	MIRROR=""
elif [[ $2 == "true" ]]; then
	# Use Ubuntu's mirror detection
	MIRROR="mirror://mirrors.ubuntu.com/mirrors.txt"
else
	# Explicit mirror, use it
	MIRROR=$2
fi

if [[ ! -f /etc/ubuntu-updated ]]; then
	if [[ ! -z $MIRROR ]]; then
		REPOS="main restricted universe multiverse"

		touch /tmp/mirrors-sources.list
		echo "deb $MIRROR $RELEASE $REPOS"           >> /tmp/mirrors-sources.list
		echo "deb $MIRROR ${RELEASE}-updates $REPOS"   >> /tmp/mirrors-sources.list
		echo "deb $MIRROR ${RELEASE}-backports $REPOS" >> /tmp/mirrors-sources.list
		echo "deb $MIRROR ${RELEASE}-security $REPOS"  >> /tmp/mirrors-sources.list

		# Add mirrors to the start
		cat /tmp/mirrors-sources.list /etc/apt/sources.list > /tmp/apt-sources.list

		# Move into place
		cp /etc/apt/sources.list /etc/apt/sources.list.bak
		mv /tmp/apt-sources.list /etc/apt/sources.list

		# Remove temp files
		rm /tmp/mirrors-sources.list /tmp/apt-sources.list
	fi

	export DEBIAN_FRONTEND=noninteractive

	apt-get -q -y update

	apt-get -q -y dist-upgrade

	apt-get -q -y autoremove

	touch /etc/ubuntu-updated
fi
