# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu-1204-amd64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"
  config.vm.hostname = "gitsome"
  config.vm.synced_folder ".", "/var/www/git-some"
  config.vm.network :forwarded_port, guest: 80, host: 80

  config.vm.provision :puppet do |puppet|
    puppet.manifests_path = "puppet/manifests"
    puppet.manifest_file = "dev.local.pp"
    puppet.module_path = "puppet/modules"
    puppet.facter = { "fqdn" => "gitsome.dev.local" }
  end

  config.vm.provider :virtualbox do |vb|
    vb.customize ["modifyvm", :id, "--memory", "1024"]
    vb.customize ["modifyvm", :id, "--cpus", "1"]
    vb.customize ["modifyvm", :id, "--name", "gitsome"]
  end
end
