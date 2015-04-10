<?php
/**
 * @file
 * Contains \Drupal\hselect2_taxonomy\Plugin\Field\FieldWidget\hselect2TaxonomyWidget.
 */

namespace Drupal\hselect2_taxonomy\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\taxonomy\Entity\Vocabulary;
use Drupal\taxonomy\Entity\Term;

/**
 * Plugin implementation of the 'hierarchical select' widget.
 *
 * @FieldWidget(
 *   id = "hselect2",
 *   label = @Translation("Hierarchical Select2"),
 *   field_types = {
 *     "entity_reference"
 *   }
 * )
 */
class hselect2TaxonomyWidget extends WidgetBase {

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    $class = get_class($this);

    // Get the selected vocabulary in your widget settings.
    $handler_settings = $this->fieldDefinition->getSetting('handler_settings');
    $vocabulary = Vocabulary::load(key($handler_settings['target_bundles']));

    // Retrieve the default_value.
    $default_value = $items->getValue();

    $element += array(
      '#type' => 'textfield',
      '#default_value' => $default_value[0]['target_id'],
      '#attributes' => array(
      'class' => array('hselect2-enabled')
      ),
      '#after_build' => array(
        array($class, 'afterBuild')
      ),
      '#id' => $vocabulary->id(),
      );

    return $element;
  }

  public static function afterBuild(array $element, FormStateInterface $form_state) {
    // Attaching hselect2.js
    $element['#attached']['library'][] = 'hselect2/hselect2.config';

    $element_value = $element['#default_value'];

    if (empty($element_value)) {
      // Add fake parent for new items.
      $parents[] = array('tid' => 0);
    }
    else {
      $term_parents = array();
      if ($term = Term::load($element_value)) {
        $term_parents[] = $term;
        $n = 0;
        while ($parent = \Drupal::entityManager()->getStorage('taxonomy_term')->loadParents($term_parents[$n]->id())) {
          $term_parents = array_merge($term_parents, $parent);
          $n++;
        }
      }

      foreach ($term_parents as $term) {
        // Create term lineage.
        $parents[] = array('tid' => $term->id());
      }
    }

    // Create settings needed for our js magic.
    $settings = array(
      'hselect2' => array(
        "{$element['#name']}" => array(
          'hash-here' => array(
            'id' => $element['#id'],
            'default_value' => $element['#default_value'],
            'parents' => array_reverse($parents),
            // This is the route for the controller.
            'path' => 'hs2_taxonomy'
          ),
        ),
      ),
    );

    // Attaching settings
    $element['#attached']['drupalSettings']['hselect2'] = $settings;

    return array('target_id' => $element);
  }

  /**
   * {@inheritdoc}
   */
  public function massageFormValues(array $values, array $form, FormStateInterface $form_state) {
    // @TODO what is the correct way to detect an empty field here?
    // Do I need to create a custom element for this case?
    // Widget Settings form.
    if ($form['#type'] == 'details') {
      if (!isset($values[0]['_original_delta'])) {
        foreach ($form_state->getValue('default_value_input') as $key => $value) {
          $values[0] = array('target_id' => reset($value));
        }
      }
    }
    else {
      if (!isset($values[0]['_original_delta'])) {
        $values[0] = array('target_id' => reset($form_state->getValue($this->fieldDefinition->getName())));
      }
    }

    return $values;
  }
}
