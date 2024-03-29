Exec {
  path => '/usr/bin:/bin:/usr/sbin:/sbin',
  logoutput => on_failure
}

include firstrun
include glacius::webapp
include glacius::db

class { 'nodejs':
  version => '0.10.5'
}

class { 'redis':
  version => '2.6.13'
}

class { 'timezone':
  timezone => 'America/Los_Angeles'
}

Class['firstrun']
  -> Class['timezone']
  -> Class['redis']
  -> Class['nodejs']
  -> Class['glacius::webapp']
  -> Class['glacius::db']