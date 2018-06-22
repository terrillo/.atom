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
  '^.+\.brief',
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

/*
 * Database Replica
 */
$databases['default']['replica'][] = array(
  'database' => getenv('MYSQL_DATABASE'),
  'username' => getenv('MYSQL_USERNAME'),
  'password' => getenv('MYSQL_PASSWORD'),
  'host' => 'ec2-18-188-3-89.us-east-2.compute.amazonaws.com',
  'port' => getenv('MYSQL_PORT'),
  'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
  'driver' => 'mysql',
);

/**
 * Dev Mode
 */
if (getenv('ENV_TYPE') == 'localhost') {

  $databases['default']['default']['prefix'] = array(
    'cache' => getenv('ENV_TYPE').'_',
  );

  // Security
  $config['system.logging']['error_level'] = 'verbose';
  $settings['rebuild_access'] = TRUE;

}

// Config Dir
$config_directories['sync'] = 'sites/default/files/config/sync';
