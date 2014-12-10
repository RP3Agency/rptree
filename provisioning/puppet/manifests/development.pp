class vagrant-guest {
	file { "/srv/app":
		ensure => 'directory',
	} ->
	file { "/srv/app/${app_name}":
		alias => 'vagrant-symlink',
		ensure => 'link',
		target => '/vagrant',
	}
}

class git-clone {
	include git

	file { "/srv/app":
		ensure => 'directory',
	} ->
	git::repo{ "${app_name}":
		path   => "/srv/app/${app_name}",
		source => "${app_repo}",
		branch => "${app_branch}",
	}
}

class apt-update {
    exec { "aptGetUpdate":
        command => "sudo apt-get update",
        path => ["/bin", "/usr/bin"],
    }
}

class othertools {
    package { "curl":
        ensure => present,
        require => Exec["aptGetUpdate"],
    }

    package { "htop":
        ensure => present,
        require => Exec["aptGetUpdate"],
    }

    package { "g++":
        ensure => present,
        require => Exec["aptGetUpdate"],
    }
}

class logs {
	logrotate::rule { "${app_name}" :
		path          => '/var/log/${app_name}.log',
		rotate        => 14,
		rotate_every  => 'daily',
		compress      => true,
		copytruncate  => true,
		ifempty       => false,
		missingok     => true,
		sharedscripts => true,
	}
}

class ruby-bundler {
	class { 'ruby':
		gems_version  => 'latest'
	} ->
	class { 'ruby::dev':
		bundler_ensure => 'installed'
	} ->
	ruby::bundle { 'bundle-install':
		cwd => "/srv/app/${app_name}",
		user => "ubuntu",
		onlyif => ["test -d /srv/app/${app_name}/Gemfile"],
	}
}

class mongo {
	class {'::mongodb::globals':
		manage_package_repo => true,
	}->
	class {'::mongodb::server':	}->
	class {'::mongodb::client': }

	mongodb_database { "${db_name}":
		ensure   => present,
		tries    => 10,
		require  => Class['mongodb::server'],
	}
}

class node-js {
	include apt
	apt::ppa {
		'ppa:chris-lea/node.js': notify => Package["nodejs"],
	}

	package { "nodejs" :
		ensure => latest,
		require => [ Exec["aptGetUpdate"], Class["apt"] ],
	}

	exec { "npm-update" :
		cwd => "/srv/app/${app_name}",
		command => "npm -g update",
		onlyif => ["test -d /srv/app/${app_name}/node_modules"],
		path => ["/bin", "/usr/bin"],
		require => Package['nodejs'],
	}
}

class base-install {
	include apt-update
	include othertools
	include logs
	include ruby-bundler
	include mongo
	include node-js
}

node /^ip-([0-9-]*)\.ec2\.internal$/ {
	include git-clone
	include base-install
}

node default {
	include vagrant-guest
	include base-install
}
