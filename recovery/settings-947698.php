<?php

$databases = array();
$config_directories = array();
$settings['hash_salt'] = '7KBBq-4TznZn83h3fla2TJHXs-N_VTRf5pNiaPA7e7lf6xhCF8hUy-jbDxOZfMxFS6k9GZ_0qw';
$settings['update_free_access'] = FALSE;
$config['brief'] = [];
$config['brief']['environment'] = 'development';

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
 * Default Database
 * @var [vars]
 */
$dbname = 'd80';
$dbuser = 'root';
$dbpassword = 'root';
$dbhost = 'mysql';

/**
 * Stage Database setup
 * @var [mixed]
 */
if (in_array($_SERVER["SERVER_NAME"], $stageDomains)) {
  $dbname = explode('.', $_SERVER["SERVER_NAME"])[1];
  $dbuser = 'brief';
  $dbpassword = 'a3tBD2GQkyRDESSQ';
  $dbhost = 'ec2-54-227-185-148.compute-1.amazonaws.com';
  $config['brief']['environment'] = 'development-stage';
}

/**
 * Live
 */
if ($_SERVER["SERVER_NAME"] == 'cb.brief.vet' || $_SERVER["SERVER_NAME"] == 'vtb.brief.vet' || !isset($_SERVER["SERVER_NAME"])) {
  $dbname = 'prod';
  $dbuser = 'brief';
  $dbpassword = 'a3tBD2GQkyRDESSQ';
  $dbhost = 'ec2-54-227-185-148.compute-1.amazonaws.com';
  $config['brief']['environment'] = 'production';
}

/**
 * Setup Config
 */
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';
$config['system.performance']['css']['preprocess'] = FALSE;
$config['system.performance']['js']['preprocess'] = FALSE;
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
$config['system.logging']['error_level'] = 'verbose';
$settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
$settings['rebuild_access'] = TRUE;

/**
 * Database setup
 * @var [array]
 */
$databases['default']['default'] = [
  'database' => $dbname,
  'username' => $dbuser,
  'password' => $dbpassword,
  'prefix' => '',
  'host' => $dbhost,
  'port' => '3306',
  'namespace' => 'Drupal\\Core\\Database\\Driver\\mysql',
  'driver' => 'mysql',
];

$settings['install_profile'] = 'standard';
$config_directories['sync'] = 'sites/default/files/config_wVsl7ZL6KjPKCZqskUgXyiVHkj3IR-KPcBl6d1oPWg6Lizk6-QbS0g9OAOANUv-KSIhLmzgz_A/sync';
