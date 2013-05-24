class glacius::webapp {
  anchor { 'glacius::web::begin':
    before => [ Class['nginx'], Class['glacius'] ]
  }

  include nginx
  include glacius

  $dir = '/var/www/glacius'
  $log_dir = "${dir}/logs"
  $config_file = "${dir}/src/config.json"

  file { $log_dir:
    ensure => directory,
  }

  file { $config_file:
    ensure => present,
    content => template('glacius/config.json.erb'),
    mode => 0644
  }

  nginx::resource::vhost { $::glacius::host:
    ensure => present,
    listen_port => $::glacius::port,
    rewrite_www_to_non_www => true,
    proxy => 'http://node',
  }

  nginx::resource::upstream { 'node':
    ensure => present,
    members => [ "localhost:${glacius::listenPort}" ],
  }

  nodeapp::instance { 'glacius':
    entry_point => "${dir}/src/app.js",
    log_dir => $log_dir,
    npm_install_dir => $dir,
    watch_config_file => "${dir}/src/watcher-config.js",
    require => [
      Nginx::Resource::Upstream['node'],
      Nginx::Resource::Vhost[$::glacius::host],
      File[$log_dir],
      File[$config_file],
    ]
  }

  anchor { 'glacius::webapp::end':
    require => Nodeapp::Instance['glacius']
  }
}