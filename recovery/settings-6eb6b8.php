<?php

/**
 * Settings
 */
$settings['install_profile'] = 'minimal';
$settings['hash_salt'] = '7KBBq-4TznZn83h3fla2TJHXs-N_VTRf5pNiaPA7e7lf6xhCF8hUy-jbDxOZfMxFS6k9GZ_0qw';
$settings['update_free_access'] = TRUE;
$config['system.performance']['css']['preprocess'] = FALSE;
$config['system.performance']['js']['preprocess'] = FALSE;

/**
 * PHP.ini
 */
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 0);

/**
 * Diable Drupal 8 core cache
 */
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
$settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';

/**
 * Directories
 */
$config_directories = array();

/**
 * Databases
 */
$databases = array();

/**
 * Ignore in file folder
 * @var [array]
 */
$settings['file_scan_ignore_directories'] = [
  'node_modules',
  'bower_components',
  'styles',
  'server'
];

/**
 * Trusted host configuration.
 * @var [array]
 */
$settings['trusted_host_patterns'] = [
  '^.+\.veterinaryteambrief\.com$',
  'veterinaryteambrief\.com$',
  '^.+\.cliniciansbrief\.com$',
  'cliniciansbrief\.com$',
  '^.+\.brief\.vet$',
  '^localhost$',
  '^cb\.brief$',
  '^vtb\.brief$',
  'cb\.brief',
  '^.+\.elasticbeanstalk\.com$',
];

/*
 * Database
 */
$databases['default']['default'] = [
  'database' => getenv('MYSQL_DATABASE'),
  'username' => getenv('MYSQL_USERNAME'),
  'password' => getenv('MYSQL_PASSWORD'),
  'host' => getenv('MYSQL_HOST'),
  'port' => getenv('MYSQL_PORT'),
  'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
  'driver' => 'mysql',
];

// $conf['cache_backends'][] = 'sites/all/modules/memcache/memcache.inc';
// $conf['lock_inc'] = 'sites/all/modules/memcache/memcache-lock.inc';
// $conf['memcache_stampede_protection'] = TRUE;
// $conf['cache_default_class'] = 'MemCacheDrupal';
//
// // The 'cache_form' bin must be assigned to non-volatile storage.
// $conf['cache_class_cache_form'] = 'DrupalDatabaseCache';
//
// // Don't bootstrap the database when serving pages from the cache.
// $conf['page_cache_without_database'] = TRUE;
// $conf['page_cache_invoke_hooks'] = TRUE;
//
// $conf['memcache_servers'] = array(
//   'memcached.lbhby4.cfg.use1.cache.amazonaws.com:11211' => 'default',
// );

/**
 * Dev Mode
 */
if (getenv('VICINITY') == 'localhost') {

  // Security
  $config['system.logging']['error_level'] = 'verbose';
  $settings['rebuild_access'] = TRUE;

}

// Config Dir
$config_directories['sync'] = 'sites/default/files/config/sync';
