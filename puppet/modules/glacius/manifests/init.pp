class glacius {
  $host = 'localhost'
  $listenPort = 3000
  $port = 80
  $staticBasePath = '/static'
  $cacheViews = false

  $redis_host = 'localhost'
  $redis_port = 6379

  $db_host = 'localhost'
  $db_user = 'glacius'
  $db_password = 'glacius'
  $db_port = 3306
  $db_database = 'glacius'

  $log_level = 'debug'
  $log_showPid = true
  $log_timestamps = 'quiet'
}