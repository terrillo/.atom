<?php

/**
 * Settings
 */
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
$settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
$settings['rebuild_access'] = TRUE;
$settings['install_profile'] = 'standard';
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
 * Stage / QA / DEV Database setup
 */
if (count(explode('.', $_SERVER["SERVER_NAME"])) > 3) {
  $stage = explode('.', $_SERVER["SERVER_NAME"])[1];
  $databases['default']['default'] = [
    'database' => 'production',
    'username' => 'brief',
    'password' => 'a3tBD2GQkyRDESSQ',
    'prefix' => '',
    'host' => 'ec2-54-227-185-148.compute-1.amazonaws.com',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
    'prefix' => array(
      'cache_container' => $stage.'_',
      'cache' => $stage.'_',
      'cache_config' => $stage.'_',
      'cache_discovery' => $stage.'_',
      'config'   => $stage.'_',
      'config_snapshot' => $stage.'_',
    ),
  ];
  $config_directories['sync'] = 'sites/default/files/config/'.$stage.'/sync';
}

/**
 * Live
 */
if ($_SERVER["SERVER_NAME"] == 'cb.brief.vet' || $_SERVER["SERVER_NAME"] == 'vtb.brief.vet' || !isset($_SERVER["SERVER_NAME"])) {
  $databases['default']['default'] = [
    'database' => 'production',
    'username' => 'brief',
    'password' => 'a3tBD2GQkyRDESSQ',
    'host' => 'ec2-54-227-185-148.compute-1.amazonaws.com',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
    'prefix' => array(
      'cache_container' => 'production_',
      'cache' => 'production_',
      'cache_config' => 'production_',
      'cache_discovery' => 'production_',
      'config'   => 'production_',
      'config_snapshot' => 'production_',
    ),
  ];
  $config_directories['sync'] = 'sites/default/files/config/prod/sync';
}

/**
 * Local
 */
if ($_ENV['SERVICE'] == 'localhost') {
  $databases['default']['default'] = [
    'database' => 'd80',
    'username' => 'root',
    'password' => 'root',
    'host' => 'mysql',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
    'prefix' => array(
      'cache_container' => 'production_',
      'cache' => 'production_',
      'cache_config' => 'production_',
      'cache_discovery' => 'production_',
      'config'   => 'production_',
      'config_snapshot' => 'production_',
    ),
  ];
  $config_directories['sync'] = 'sites/default/files/config/sync';
}
