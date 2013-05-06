class gitsome::webapp {
  anchor { 'gitsome::web::begin':
    before => [ Class['nginx'], Class['gitsome'] ]
  }

  include nginx
  include gitsome

  $dir = '/var/www/git-some'
  $log_dir = "${dir}/logs"
  $config_file = "${dir}/src/config.json"

  file { $log_dir:
    ensure => directory,
  }

  file { $config_file:
    ensure => present,
    content => template('gitsome/config.json.erb'),
    mode => 0644
  }

  nginx::resource::vhost { $::gitsome::host:
    ensure => present,
    listen_port => $::gitsome::port,
    rewrite_www_to_non_www => true,
    proxy => 'http://node',
  }

  nginx::resource::upstream { 'node':
    ensure => present,
    members => [ "localhost:${gitsome::listenPort}" ],
  }

  nodeapp::instance { 'gitsome':
    entry_point => "${dir}/src/app.js",
    log_dir => $log_dir,
    npm_install_dir => $dir,
    watch_config_file => "${dir}/src/watcher-config.js",
    require => [
      Nginx::Resource::Upstream['node'],
      Nginx::Resource::Vhost[$::gitsome::host],
      File[$log_dir],
      File[$config_file],
    ]
  }

  anchor { 'gitsome::webapp::end':
    require => Nodeapp::Instance['gitsome']
  }
}