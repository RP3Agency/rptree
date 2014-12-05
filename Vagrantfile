# -*- mode: ruby -*-
# vi: set ft=ruby :

require "yaml"

# Load default git-managed configuration
_config = YAML.load(
	File.open(
		File.join(File.dirname(__FILE__), "provisioning/default.yaml"),
		File::RDONLY
	).read
)

# Load other configuration files
config_files = [ "provisioning/config.yaml", "provisioning/config.local.yaml" ]
config_files.each do |filename|
	begin
		confvars = YAML.load(
			File.open(
				File.join(File.dirname(__FILE__), filename),
				File::RDONLY
			).read
		)

		_config.merge!(confvars) if confvars.is_a?(Hash)
	rescue Errno::ENOENT
		# No overriden YAML found -- that's OK; just use the defaults.
	end
end

CONF = _config

# Add extra extension modules
base_path = Pathname.new( File.dirname( __FILE__ ) )
module_paths = [ base_path.to_s + "/provisioning/puppet/modules" ]
module_paths.concat Dir.glob( base_path.to_s + "/extensions/*/modules" )

# Convert to relative from Vagrantfile
module_paths.map! do |path|
	pathname = Pathname.new(path)
	pathname.relative_path_from(base_path).to_s
end

Vagrant.configure("2") do |config|
	# Store the current version of Vagrant for use in conditionals when dealing
	# with possible backward compatible issues.
	vagrant_version = Vagrant::VERSION.sub(/^v/, '')

	# Setup VM image to be used
	config.vm.box = CONF['box']

	# Networking config - "dhcp" or specific IP address
	# VM hostname will be set to the first host in config
	if CONF['ip'] == "dhcp"
		config.vm.network :private_network, type: "dhcp"
	else
		config.vm.network :private_network, ip: CONF['ip']
	end
	config.vm.hostname = CONF['hosts'][0]

	# Define forwarded ports
	CONF['ports'].each do |port|
		config.vm.network :forwarded_port, host: port['host'], guest: port['guest']
	end

	# Configure VirtualBox VM
	#  - VM name set to project name
	#  - VM memory set to configured value
	#  - NAT guest should use host DNS resolver
	config.vm.provider "virtualbox" do |vb|
		vb.customize [
			"modifyvm", :id,
			"--name", CONF['name'],
			"--cpus", CONF['cpus'],
			"--memory", CONF['memory'],
			"--natdnshostresolver1", "on"
		]
	end

	# Define host manager settings - requires Vagrant plugin
	config.hostmanager.enabled = true
  	config.hostmanager.manage_host = true
  	config.hostmanager.ignore_private_ip = false
  	config.hostmanager.include_offline = true
	config.hostmanager.aliases = CONF['hosts']

	# Before any other provisioning, ensure that we're up-to-date
	bootstrap_args = [
		CONF['apt_release'].to_s,
		CONF['apt_mirror'].to_s
	]
	config.vm.provision :shell, :path => "provisioning/bootstrap.sh", :args => bootstrap_args

	# Provision our setup with Puppet
	config.vm.provision :puppet do |puppet|
		puppet.manifests_path = "provisioning/puppet/manifests"
		puppet.manifest_file  = "development.pp"
		puppet.facter = CONF['puppet']

		# Broken due to https://github.com/mitchellh/vagrant/issues/2902
		## puppet.module_path    = module_paths
		# Workaround:
		module_paths.map! { |rel_path| "/vagrant/" + rel_path }
		puppet.options = "--modulepath " +  module_paths.join( ':' ).inspect

		puppet.options = puppet.options + " --environment vagrant"
		#puppet.options = puppet.options + " --verbose --debug"
	end

	# Ensure that the shared directory is fully writable from the guest
	if vagrant_version >= "1.3.0"
		config.vm.synced_folder ".", "/vagrant", :mount_options => [ "dmode=777,fmode=777" ]
	else
		config.vm.synced_folder ".", "/vagrant", :extra => "dmode=777,fmode=777"
	end

	# Success?
end
