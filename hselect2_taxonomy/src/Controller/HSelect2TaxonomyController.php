<?php
/**
 * @file
 * Contains \Drupal\hselect2_taxonomy\Controller\HSelect2TaxonomyController.
 */

namespace Drupal\hselect2_taxonomy\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;

class HSelect2TaxonomyController extends ControllerBase {

  public function request(Request $request) {

    // Obtain the data from the json.
    $data = json_decode($request->getContent());

    // Request terms for the current vocabulary.
    $terms = \Drupal::entityManager()->getStorage('taxonomy_term')->loadTree($data->arguments->id, $data->arguments->parent, 1);
    foreach ($terms as $term) {
      $response[] = array('id' => (int) $term->tid, 'text' => $term->name);
    }

    return json_encode($response);
  }

}
