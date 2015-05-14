/**
 * @file
 * hselect2 behaviors.
 */

(function ($, Drupal, drupalSettings) {

  "use strict";

  Drupal.behaviors.hselect2Create = {

    // Default function to attach the behavior.
    attach: function (context) {

      $('input.hselect2-enabled')
        .addClass('visually-hidden')
        .each(function() {
          var $field = $(this);
          var fieldName = $(this).attr('name');
          // Check Settings for the current field.
          if (fieldName in drupalSettings.hselect2.hselect2) {
            var fieldSettings = {};
            // Since we store the field settings within an associative array with
            // random strings as keys (reason: http://drupal.org/node/208611) we
            // need to get the last setting for this field.
            $.each(drupalSettings.hselect2.hselect2[fieldName], function(hash, setting) {
              fieldSettings = setting;
            });

            var level = 0;
            var parent_id = 0;
            var $select;
            // Update class of wrapper element.
            $field.parent('.form-item');
            // Create elements for each parent of the current value.
            $.each(fieldSettings.parents, function(index, parent) {

              level++;

              // Create select element.
              $select = hSelect2ElementCreate($field.attr('id'), fieldSettings, level);
              if ($field.hasClass('error')) {
                // Add error-class if there was an error with the original field.
                $select.addClass('error');
              }

              // We need to use parent_id to determine the "child" requested by
              // getChildren(). For the first position we need the first results
              // for this vocabulary so the parent_id should be 0.
              // parent.tid is the default value that should be selected from
              // getChildren() when generating the child.
              if (index == 0) {
                parent_id = 0;
              }
              else {
                parent_id = fieldSettings.parents[index-1].tid;
              }

              // Retrieve data for this level.
              getChildren($select, fieldSettings, parent_id, parent.tid, $field.attr('id'))
                .then(function (data) {
                  if (data !== 'null') {
                    // From json to Object (required format by Select2).
                    data = jQuery.parseJSON(data);

                    // We need an empty value as first value otherwise Select2 placeholde
                    // does not work.
                    data.unshift({id: '', text: '- None-'});

                    // Adding the select.
                    $select.appendTo($field.parent());

                    // Instantiate Select2.
                    var $element = $("#" + $select.attr('id')).select2({
                      placeholder: "Select..."
                      //allowClear : true
                    });

                    // Add options to the select.
                    for (var d = 0; d < data.length; d++) {
                      var item = data[d];
                      if (item.id == parent.tid) {

                        // Create the DOM option that is pre-selected by default
                        var option = new Option(item.text, item.id, true, true);
                      }
                      else {
                        var option = new Option(item.text, item.id, true, false);
                      }

                      // Append new option to the select.
                      $element.append(option);
                    }

                    $element.select2();
                  }
                });
            });
            // Once selects are added then request for the next level if exists.
            updateElements($("#" + $select.attr('id')).select2(), $field.attr('id'), fieldSettings, level);
          }
        });
    }
  }

  /**
   * Load direct children of a selected value.
   *
   * @param $element
   *   Element to fill with terms.
   * @param settings
   *   Field settings.
   * @param parent_value
   *   Value which has been selected in the parent element.
   * @param default_value
   *   Value to use as default.
   * @param base_id
   *   ID of original field which is rewritten as "taxonomy_shs".
   *
   * @return
   *   Ajax request.
   */
  function getChildren($element, settings, parent_value, default_value, base_id) {

    return $.ajax({
      url: '/' + settings.path + '?XDEBUG_SESSION_START=PHPSTORM',
      type: 'POST',
      dataType: 'json',
      // Async to true could generate an incorrect order for selects.
      async: false,
      contentType: 'application/json',
      Accept: 'application/json',
      cache: true,
      data: JSON.stringify({
        arguments: {
          id: settings.id,
          parent: parent_value
        }
      })
    });
  }


  /**
   * Update the changed element.
   *
   * @param $triggering_element
   *   Element which has been changed.
   * @param base_id
   *   ID of original field which is rewritten as "taxonomy_shs".
   * @param settings
   *   Field settings.
   * @param level
   *   Current level in hierarchy.
   */
  function updateElements($triggering_element, base_id, settings, level) {

    // Remove all following elements.
    $triggering_element.nextAll('select').each(function() {
      // Remove element and destroy select2 instance.
      $(this).select2('destroy');
      $(this).remove();
    });

    $triggering_element.nextAll('.shs-term-add-new-wrapper').remove();
    // Create next level (if the value is != 0).
    if ($triggering_element.val() != 0) {
      level++;
      var $element_new = hSelect2ElementCreate(base_id, settings, level);
      // Retrieve list of items for the new element.
      getChildren($element_new, settings, $triggering_element.val(), 0, base_id)
        .then(function(data){
          // From json to Object (required format by Select2).
          data = jQuery.parseJSON(data);
          // Verifies that we have terms to build the next level.
          if (!jQuery.isEmptyObject(data)) {
            // We need an empty value as first value otherwise Select2 placeholder
            // does not work.
            data.unshift({id: '', text: '- None -'});
            // Adding the select.
            $element_new.appendTo($triggering_element.parent());
            // Instantiate Select2.
            var $element = $("#" + $element_new.attr('id')).select2({
              placeholder: 'Select...'
              //data: data,
              //allowClear : true
            });

            // Add options to the select.
            for (var d = 0; d < data.length; d++) {
              var item = data[d];
              if (item.id == parent.tid) {

                // Create the DOM option that is pre-selected by default
                var option = new Option(item.text, item.id, true, true);
              }
              else {
                var option = new Option(item.text, item.id, true, false);
              }

              // Append new option to the select.
              $element.append(option);
            }
            $element.select2();
          }
        });
    }

    // Set value of original field.
    updateFieldValue($triggering_element, base_id, level, settings.multiple);
  }

  /**
   * Create a new <select> element.
   *
   * @param base_id
   *   ID of original field which is rewritten as "taxonomy_shs".
   * @param settings
   *   Field settings.
   * @param level
   *   Current level in hierarchy.
   *
   * @return
   *   The new (empty) <select> element.
   */
  function hSelect2ElementCreate(base_id, settings, level) {
    return $('<select>')
      .attr('id', base_id + '-select-' + level)
      .addClass('hselect2')
      // Add core class to apply default styles to the element.
      .addClass('form-select')
      .addClass('hselect2-level-' + level)
      .bind('change', function() {
        updateElements($(this), base_id, settings, level);
      });
  }

  /**
   * Update value of original (hidden) field.
   *
   * @param $triggering_element
   *   Element which has been changed.
   * @param base_id
   *   ID of original field which is rewritten as "taxonomy_shs".
   * @param level
   *   Current level in hierarchy.
   */
  function updateFieldValue($triggering_element, base_id, level, multiple) {
    // Reset value of original field.
    var $field_orig = $('#' + base_id);

    // Get the last selected option. So when removing the current will take the previous.
    if (level > 1) {
      var new_val = $("#" + base_id + "-select-" + (level - 1)).select2('val');
    }
    else  {
      var new_val = $triggering_element.val();
    }
    // Add the value to the input.
    $field_orig.val(new_val);

  }

})(jQuery, Drupal, drupalSettings);
