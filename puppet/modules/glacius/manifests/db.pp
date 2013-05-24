class glacius::db {
  anchor { 'glacius::db::begin':
    before => Class['glacius']
  }

  include glacius
  include mysql::server

  mysql::db { 'glacius':
    host => 'localhost',
    user => $::glacius::db_user,
    password => $::glacius::db_password,
    grant => [ 'all' ],
    require => Class['mysql::server']
  }

  $user = "${glacius::db_user}@${glacius::db_host}"
  database_grant { $user:
    privileges => ['all'],
    require => Mysql::Db['glacius']
  }

  anchor { 'glacius::db::end':
    require => Database_grant[$user]
  }
}