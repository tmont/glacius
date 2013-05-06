class gitsome::db {
  anchor { 'gitsome::db::begin':
    before => Class['gitsome']
  }

  include gitsome
  include mysql::server

  mysql::db { 'gitsome':
    host => 'localhost',
    user => $::gitsome::db_user,
    password => $::gitsome::db_password,
    grant => [ 'all' ],
    require => Class['mysql::server']
  }

  $user = "${gitsome::db_user}@${gitsome::db_host}"
  database_grant { $user:
    privileges => ['all'],
    require => Mysql::Db['gitsome']
  }

  anchor { 'gitsome::db::end':
    require => Database_grant[$user]
  }
}