<?php

/**
 * @file
 * Contains \Drupal\hselect2_taxonomy\Plugin\views\filter\HSelectFilter.
 */

namespace Drupal\hselect2_taxonomy\Plugin\views\filter;

use Drupal\Core\Form\FormStateInterface;
use Drupal\taxonomy\Plugin\views\filter\TaxonomyIndexTid;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Filter by term id.
 *
 * @ingroup views_filter_handlers
 *
 * @ViewsFilter("taxonomy_index_tid_hselect")
 */
class HSelectFilter extends TaxonomyIndexTid {


  /**
   * {@inheritdoc}
   */
  public function buildExtraOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildExtraOptionsForm($form, $form_state);

    // Adding HSelect2 to the filter options.
    $form['type']['#options'] += array(
      'hselect2' => $this->t('HSelect2'),
    );
  }

  /**
   * {@inheritdoc}
   */
  protected function valueForm(&$form, FormStateInterface $form_state) {
    if ($this->options['type'] == 'hselect2') {

      // Attach js library for hselect2.
      $form['#attached']['library'][] = 'hselect2/hselect2.config';
      $form['#attached']['library'][] = 'core/drupal.ajax';
      // No parents needed.
      $parents[] = array('tid' => 0);
      // Create settings needed for our js magic.
      $settings = array(
        'hselect2' => array(
          "{$this->realField}" => array(
            'hash-here' => array(
              'id' => $this->options['vid'],
              'parents' => array_reverse($parents),
              // This is the route for the controller.
              'path' => 'hs2_taxonomy'
            ),
          ),
        ),
      );

      // Attaching settings
      $form['#attached']['drupalSettings']['hselect2'] = $settings;

      $form['value'] = array(
        '#type' => 'textfield',
        '#attributes' => array(
          'class' => array('hselect2-enabled')
        ),
        '#id' => $this->options['vid'],
      );
    }
  }

}

