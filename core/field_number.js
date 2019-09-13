/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Number input field
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

goog.provide('Blockly.FieldNumber');

goog.require('Blockly.fieldRegistry');
goog.require('Blockly.FieldTextInput');
goog.require('Blockly.utils.object');


/**
 * Class for an editable number field.
 * @param {string|number=} opt_value The initial value of the field. Should cast
 *    to a number. Defaults to 0.
 * @param {(string|number)=} opt_min Minimum value.
 * @param {(string|number)=} opt_max Maximum value.
 * @param {(string|number)=} opt_precision Precision for value.
 * @param {Function=} opt_validator A function that is called to validate
 *    changes to the field's value. Takes in a number & returns a validated
 *    number, or null to abort the change.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
Blockly.FieldNumber = function(opt_value, opt_min, opt_max, opt_precision,
    opt_validator) {
  
  /**
   * The minimum value constraint.
   * @type {number}
   * @protected
   */
  this.min_ = -Infinity;

  /**
   * The maximum value constraint.
   * @type {number}
   * @protected
   */
  this.max_ = Infinity;

  /**
   * The precision constraint for the value.
   * @type {number}
   * @protected
   */
  this.precision_ = 0;

  Blockly.FieldNumber.superClass_.constructor.call(
      this, opt_value || 0, opt_validator);

  this.setConstraints(opt_min, opt_max, opt_precision);
};
Blockly.utils.object.inherits(Blockly.FieldNumber, Blockly.FieldTextInput);

/**
 * Construct a FieldNumber from a JSON arg object.
 * @param {!Object} options A JSON object with options (value, min, max, and
 *                          precision).
 * @return {!Blockly.FieldNumber} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldNumber.fromJson = function(options) {
  return new Blockly.FieldNumber(options['value'],
      options['min'], options['max'], options['precision']);
};

/**
 * Serializable fields are saved by the XML renderer, non-serializable fields
 * are not. Editable fields should also be serializable.
 * @type {boolean}
 * @const
 */
Blockly.FieldNumber.prototype.SERIALIZABLE = true;

/**
 * Set the maximum, minimum and precision constraints on this field.
 * Any of these properties may be undefined or NaN to be disabled.
 * Setting precision (usually a power of 10) enforces a minimum step between
 * values. That is, the user's value will rounded to the closest multiple of
 * precision. The least significant digit place is inferred from the precision.
 * Integers values can be enforces by choosing an integer precision.
 * @param {number|string|undefined} min Minimum value.
 * @param {number|string|undefined} max Maximum value.
 * @param {number|string|undefined} precision Precision for value.
 */
Blockly.FieldNumber.prototype.setConstraints = function(min, max, precision) {
  precision = Number(precision);
  if (!isNaN(precision)) {
    this.precision_ = precision;
  }
  var precisionString = this.precision_.toString();
  var decimalIndex = precisionString.indexOf('.');
  this.fractionalDigits_ = (decimalIndex == -1) ? -1 :
      precisionString.length - (decimalIndex + 1);
  min = Number(min);
  if (!isNaN(min)) {
    this.min_ = min;
  }
  max = Number(max);
  if (!isNaN(max)) {
    this.max_ = max;
  }
  this.setValue(this.getValue());
};

/**
 * Ensure that the input value is a valid number (must fulfill the
 * constraints placed on the field).
 * @param {*=} opt_newValue The input value.
 * @return {?number} A valid number, or null if invalid.
 * @protected
 * @override
 */
Blockly.FieldNumber.prototype.doClassValidation_ = function(opt_newValue) {
  if (opt_newValue === null) {
    return null;
  }
  // Clean up text.
  var newValue = String(opt_newValue);
  // TODO: Handle cases like 'ten', '1.203,14', etc.
  // 'O' is sometimes mistaken for '0' by inexperienced users.
  newValue = newValue.replace(/O/ig, '0');
  // Strip out thousands separators.
  newValue = newValue.replace(/,/g, '');

  // Clean up number.
  var n = Number(newValue || 0);
  if (isNaN(n)) {
    // Invalid number.
    return null;
  }
  // Get the value in range.
  n = Math.min(Math.max(n, this.min_), this.max_);
  // Round to nearest multiple of precision.
  if (this.precision_ && isFinite(n)) {
    n = Math.round(n / this.precision_) * this.precision_;
  }
  // Clean up floating point errors.
  n = (this.fractionalDigits_ == -1) ? n :
      Number(n.toFixed(this.fractionalDigits_));
  return n;
};

/**
 * Create the number input editor widget.
 * @return {!HTMLElement} The newly created number input editor.
 * @protected
 * @override
 */
Blockly.FieldNumber.prototype.widgetCreate_ = function() {
  var htmlInput = Blockly.FieldNumber.superClass_.widgetCreate_.call(this);

  // Set the accessibility state
  if (this.min_ > -Infinity) {
    Blockly.utils.aria.setState(htmlInput,
        Blockly.utils.aria.State.VALUEMIN, this.min_);
  }
  if (this.max_ < Infinity) {
    Blockly.utils.aria.setState(htmlInput,
        Blockly.utils.aria.State.VALUEMAX, this.max_);
  }
  return htmlInput;
};

Blockly.fieldRegistry.register('field_number', Blockly.FieldNumber);
