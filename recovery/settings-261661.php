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
$settings['update_free_access'] = FALSE;

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
$config_directories['sync'] = 'sites/default/files/config_wVsl7ZL6KjPKCZqskUgXyiVHkj3IR-KPcBl6d1oPWg6Lizk6-QbS0g9OAOANUv-KSIhLmzgz_A/sync';

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
 * Local Domains
 * @var [array]
 */
$localDomains = [
  'localhost',
  'cb.brief',
  'vtb.brief'
];

$stageDomains = [
  'stage1.brief.vet',
  'cb.stage1.brief.vet',
  'vtb.stage1.brief.vet',
  'stage2.brief.vet',
  'cb.stage2.brief.vet',
  'vtb.stage2.brief.vet',
  'stage3.brief.vet',
  'cb.stage3.brief.vet',
  'vtb.stage3.brief.vet',
  'stage4.brief.vet',
  'cb.stage4.brief.vet',
  'vtb.stage4.brief.vet',
];

/**
 * Stage Database setup
 * @var [mixed]
 */
if (count(explode('.', $_SERVER["SERVER_NAME"])) > 3) {
  $databases['default']['default'] = [
    'database' => explode('.', $_SERVER["SERVER_NAME"])[1],
    'username' => 'brief',
    'password' => 'a3tBD2GQkyRDESSQ',
    'prefix' => '',
    'host' => 'ec2-54-227-185-148.compute-1.amazonaws.com',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
  ];
}

/**
 * Live
 */
if ($_SERVER["SERVER_NAME"] == 'cb.brief.vet' || $_SERVER["SERVER_NAME"] == 'vtb.brief.vet' || !isset($_SERVER["SERVER_NAME"])) {
  $databases['default']['default'] = [
    'database' => 'prod',
    'username' => 'brief',
    'password' => 'a3tBD2GQkyRDESSQ',
    'prefix' => '',
    'host' => 'ec2-54-227-185-148.compute-1.amazonaws.com',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
  ];
  $databases['default']['slave'] = [
    'database' => 'prod_slave',
    'username' => 'brief',
    'password' => 'a3tBD2GQkyRDESSQ',
    'prefix' => '',
    'host' => 'ec2-54-227-185-148.compute-1.amazonaws.com',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
  ];
}

/**
 * Local
 */
if ($_ENV['SERVICE'] == 'localhost') {
  $databases['default']['default'] = [
    'database' => 'd80',
    'username' => 'root',
    'password' => 'root',
    'prefix' => '',
    'host' => 'mysql',
    'port' => '3306',
    'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
    'driver' => 'mysql',
  ];
}
