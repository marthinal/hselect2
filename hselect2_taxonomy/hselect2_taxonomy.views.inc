<?php

/**
 * @file
 * Provides views data for taxonomy.module.
 */

use Drupal\field\FieldStorageConfigInterface;

/**
 * Implements hook_field_views_data_alter().
 *
 * Views integration for entity reference fields which reference taxonomy terms.
 * Adds a term relationship to the default field data.
 *
 * @see views_field_default_views_data()
 */
function hselect2_taxonomy_field_views_data_alter(array &$data, FieldStorageConfigInterface $field_storage) {
  if ($field_storage->getType() == 'entity_reference' && $field_storage->getSetting('target_type') == 'taxonomy_term') {
    foreach ($data as $table_name => $table_data) {
      foreach ($table_data as $field_name => $field_data) {
        if (isset($field_data['filter']) && $field_name != 'delta') {
          $data[$table_name][$field_name]['filter']['id'] = 'taxonomy_index_tid_hselect';
        }
      }
    }
  }
}
