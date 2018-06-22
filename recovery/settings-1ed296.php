<?php

/**
 * Settings
 */
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
$settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
$settings['rebuild_access'] = TRUE;
$settings['install_profile'] = 'minimal';
$settings['hash_salt'] = '7KBBq-4TznZn83h3fla2TJHXs-N_VTRf5pNiaPA7e7lf6xhCF8hUy-jbDxOZfMxFS6k9GZ_0qw';
$settings['update_free_access'] = TRUE;

/**
 * Config
 */
$config['system.performance']['css']['preprocess'] = FALSE;
$config['system.performance']['js']['preprocess'] = FALSE;
$config['brief'] = [];
$config['system.logging']['error_level'] = 'verbose';
$config['brief']['environment'] = 'development';

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
  '^.+\.brief\.vet$',
  '^localhost$',
  '^cb\.brief$',
  '^vtb\.brief$',
];

/**
 * Local
 */
$databases['default']['default'] = [
  'database' => 'd8',
  'username' => 'root',
  'password' => 'root',
  'host' => 'mysql',
  'port' => '3306',
  'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
  'driver' => 'mysql',
];
$config_directories['sync'] = 'sites/default/files/config/sync';
