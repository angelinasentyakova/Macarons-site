"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * jQuery Validation Plugin v1.19.3
 *
 * https://jqueryvalidation.org/
 *
 * Copyright (c) 2021 Jörn Zaefferer
 * Released under the MIT license
 */
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
    module.exports = factory(require("jquery"));
  } else {
    factory(jQuery);
  }
})(function ($) {
  $.extend($.fn, {
    // https://jqueryvalidation.org/validate/
    validate: function validate(options) {
      // If nothing is selected, return nothing; can't chain anyway
      if (!this.length) {
        if (options && options.debug && window.console) {
          console.warn("Nothing selected, can't validate, returning nothing.");
        }

        return;
      } // Check if a validator for this form was already created


      var validator = $.data(this[0], "validator");

      if (validator) {
        return validator;
      } // Add novalidate tag if HTML5.


      this.attr("novalidate", "novalidate");
      validator = new $.validator(options, this[0]);
      $.data(this[0], "validator", validator);

      if (validator.settings.onsubmit) {
        this.on("click.validate", ":submit", function (event) {
          // Track the used submit button to properly handle scripted
          // submits later.
          validator.submitButton = event.currentTarget; // Allow suppressing validation by adding a cancel class to the submit button

          if ($(this).hasClass("cancel")) {
            validator.cancelSubmit = true;
          } // Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button


          if ($(this).attr("formnovalidate") !== undefined) {
            validator.cancelSubmit = true;
          }
        }); // Validate the form on submit

        this.on("submit.validate", function (event) {
          if (validator.settings.debug) {
            // Prevent form submit to be able to see console output
            event.preventDefault();
          }

          function handle() {
            var hidden, result; // Insert a hidden input as a replacement for the missing submit button
            // The hidden input is inserted in two cases:
            //   - A user defined a `submitHandler`
            //   - There was a pending request due to `remote` method and `stopRequest()`
            //     was called to submit the form in case it's valid

            if (validator.submitButton && (validator.settings.submitHandler || validator.formSubmitted)) {
              hidden = $("<input type='hidden'/>").attr("name", validator.submitButton.name).val($(validator.submitButton).val()).appendTo(validator.currentForm);
            }

            if (validator.settings.submitHandler && !validator.settings.debug) {
              result = validator.settings.submitHandler.call(validator, validator.currentForm, event);

              if (hidden) {
                // And clean up afterwards; thanks to no-block-scope, hidden can be referenced
                hidden.remove();
              }

              if (result !== undefined) {
                return result;
              }

              return false;
            }

            return true;
          } // Prevent submit for invalid forms or custom submit handlers


          if (validator.cancelSubmit) {
            validator.cancelSubmit = false;
            return handle();
          }

          if (validator.form()) {
            if (validator.pendingRequest) {
              validator.formSubmitted = true;
              return false;
            }

            return handle();
          } else {
            validator.focusInvalid();
            return false;
          }
        });
      }

      return validator;
    },
    // https://jqueryvalidation.org/valid/
    valid: function valid() {
      var valid, validator, errorList;

      if ($(this[0]).is("form")) {
        valid = this.validate().form();
      } else {
        errorList = [];
        valid = true;
        validator = $(this[0].form).validate();
        this.each(function () {
          valid = validator.element(this) && valid;

          if (!valid) {
            errorList = errorList.concat(validator.errorList);
          }
        });
        validator.errorList = errorList;
      }

      return valid;
    },
    // https://jqueryvalidation.org/rules/
    rules: function rules(command, argument) {
      var element = this[0],
          isContentEditable = typeof this.attr("contenteditable") !== "undefined" && this.attr("contenteditable") !== "false",
          settings,
          staticRules,
          existingRules,
          data,
          param,
          filtered; // If nothing is selected, return empty object; can't chain anyway

      if (element == null) {
        return;
      }

      if (!element.form && isContentEditable) {
        element.form = this.closest("form")[0];
        element.name = this.attr("name");
      }

      if (element.form == null) {
        return;
      }

      if (command) {
        settings = $.data(element.form, "validator").settings;
        staticRules = settings.rules;
        existingRules = $.validator.staticRules(element);

        switch (command) {
          case "add":
            $.extend(existingRules, $.validator.normalizeRule(argument)); // Remove messages from rules, but allow them to be set separately

            delete existingRules.messages;
            staticRules[element.name] = existingRules;

            if (argument.messages) {
              settings.messages[element.name] = $.extend(settings.messages[element.name], argument.messages);
            }

            break;

          case "remove":
            if (!argument) {
              delete staticRules[element.name];
              return existingRules;
            }

            filtered = {};
            $.each(argument.split(/\s/), function (index, method) {
              filtered[method] = existingRules[method];
              delete existingRules[method];
            });
            return filtered;
        }
      }

      data = $.validator.normalizeRules($.extend({}, $.validator.classRules(element), $.validator.attributeRules(element), $.validator.dataRules(element), $.validator.staticRules(element)), element); // Make sure required is at front

      if (data.required) {
        param = data.required;
        delete data.required;
        data = $.extend({
          required: param
        }, data);
      } // Make sure remote is at back


      if (data.remote) {
        param = data.remote;
        delete data.remote;
        data = $.extend(data, {
          remote: param
        });
      }

      return data;
    }
  }); // JQuery trim is deprecated, provide a trim method based on String.prototype.trim

  var trim = function trim(str) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim#Polyfill
    return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  }; // Custom selectors


  $.extend($.expr.pseudos || $.expr[":"], {
    // '|| $.expr[ ":" ]' here enables backwards compatibility to jQuery 1.7. Can be removed when dropping jQ 1.7.x support
    // https://jqueryvalidation.org/blank-selector/
    blank: function blank(a) {
      return !trim("" + $(a).val());
    },
    // https://jqueryvalidation.org/filled-selector/
    filled: function filled(a) {
      var val = $(a).val();
      return val !== null && !!trim("" + val);
    },
    // https://jqueryvalidation.org/unchecked-selector/
    unchecked: function unchecked(a) {
      return !$(a).prop("checked");
    }
  }); // Constructor for validator

  $.validator = function (options, form) {
    this.settings = $.extend(true, {}, $.validator.defaults, options);
    this.currentForm = form;
    this.init();
  }; // https://jqueryvalidation.org/jQuery.validator.format/


  $.validator.format = function (source, params) {
    if (arguments.length === 1) {
      return function () {
        var args = $.makeArray(arguments);
        args.unshift(source);
        return $.validator.format.apply(this, args);
      };
    }

    if (params === undefined) {
      return source;
    }

    if (arguments.length > 2 && params.constructor !== Array) {
      params = $.makeArray(arguments).slice(1);
    }

    if (params.constructor !== Array) {
      params = [params];
    }

    $.each(params, function (i, n) {
      source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
        return n;
      });
    });
    return source;
  };

  $.extend($.validator, {
    defaults: {
      messages: {},
      groups: {},
      rules: {},
      errorClass: "error",
      pendingClass: "pending",
      validClass: "valid",
      errorElement: "label",
      focusCleanup: false,
      focusInvalid: true,
      errorContainer: $([]),
      errorLabelContainer: $([]),
      onsubmit: true,
      ignore: ":hidden",
      ignoreTitle: false,
      onfocusin: function onfocusin(element) {
        this.lastActive = element; // Hide error label and remove error class on focus if enabled

        if (this.settings.focusCleanup) {
          if (this.settings.unhighlight) {
            this.settings.unhighlight.call(this, element, this.settings.errorClass, this.settings.validClass);
          }

          this.hideThese(this.errorsFor(element));
        }
      },
      onfocusout: function onfocusout(element) {
        if (!this.checkable(element) && (element.name in this.submitted || !this.optional(element))) {
          this.element(element);
        }
      },
      onkeyup: function onkeyup(element, event) {
        // Avoid revalidate the field when pressing one of the following keys
        // Shift       => 16
        // Ctrl        => 17
        // Alt         => 18
        // Caps lock   => 20
        // End         => 35
        // Home        => 36
        // Left arrow  => 37
        // Up arrow    => 38
        // Right arrow => 39
        // Down arrow  => 40
        // Insert      => 45
        // Num lock    => 144
        // AltGr key   => 225
        var excludedKeys = [16, 17, 18, 20, 35, 36, 37, 38, 39, 40, 45, 144, 225];

        if (event.which === 9 && this.elementValue(element) === "" || $.inArray(event.keyCode, excludedKeys) !== -1) {
          return;
        } else if (element.name in this.submitted || element.name in this.invalid) {
          this.element(element);
        }
      },
      onclick: function onclick(element) {
        // Click on selects, radiobuttons and checkboxes
        if (element.name in this.submitted) {
          this.element(element); // Or option elements, check parent select in that case
        } else if (element.parentNode.name in this.submitted) {
          this.element(element.parentNode);
        }
      },
      highlight: function highlight(element, errorClass, validClass) {
        if (element.type === "radio") {
          this.findByName(element.name).addClass(errorClass).removeClass(validClass);
        } else {
          $(element).addClass(errorClass).removeClass(validClass);
        }
      },
      unhighlight: function unhighlight(element, errorClass, validClass) {
        if (element.type === "radio") {
          this.findByName(element.name).removeClass(errorClass).addClass(validClass);
        } else {
          $(element).removeClass(errorClass).addClass(validClass);
        }
      }
    },
    // https://jqueryvalidation.org/jQuery.validator.setDefaults/
    setDefaults: function setDefaults(settings) {
      $.extend($.validator.defaults, settings);
    },
    messages: {
      required: "This field is required.",
      remote: "Please fix this field.",
      email: "Please enter a valid email address.",
      url: "Please enter a valid URL.",
      date: "Please enter a valid date.",
      dateISO: "Please enter a valid date (ISO).",
      number: "Please enter a valid number.",
      digits: "Please enter only digits.",
      equalTo: "Please enter the same value again.",
      maxlength: $.validator.format("Please enter no more than {0} characters."),
      minlength: $.validator.format("Please enter at least {0} characters."),
      rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
      range: $.validator.format("Please enter a value between {0} and {1}."),
      max: $.validator.format("Please enter a value less than or equal to {0}."),
      min: $.validator.format("Please enter a value greater than or equal to {0}."),
      step: $.validator.format("Please enter a multiple of {0}.")
    },
    autoCreateRanges: false,
    prototype: {
      init: function init() {
        this.labelContainer = $(this.settings.errorLabelContainer);
        this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
        this.containers = $(this.settings.errorContainer).add(this.settings.errorLabelContainer);
        this.submitted = {};
        this.valueCache = {};
        this.pendingRequest = 0;
        this.pending = {};
        this.invalid = {};
        this.reset();
        var currentForm = this.currentForm,
            groups = this.groups = {},
            rules;
        $.each(this.settings.groups, function (key, value) {
          if (typeof value === "string") {
            value = value.split(/\s/);
          }

          $.each(value, function (index, name) {
            groups[name] = key;
          });
        });
        rules = this.settings.rules;
        $.each(rules, function (key, value) {
          rules[key] = $.validator.normalizeRule(value);
        });

        function delegate(event) {
          var isContentEditable = typeof $(this).attr("contenteditable") !== "undefined" && $(this).attr("contenteditable") !== "false"; // Set form expando on contenteditable

          if (!this.form && isContentEditable) {
            this.form = $(this).closest("form")[0];
            this.name = $(this).attr("name");
          } // Ignore the element if it belongs to another form. This will happen mainly
          // when setting the `form` attribute of an input to the id of another form.


          if (currentForm !== this.form) {
            return;
          }

          var validator = $.data(this.form, "validator"),
              eventType = "on" + event.type.replace(/^validate/, ""),
              settings = validator.settings;

          if (settings[eventType] && !$(this).is(settings.ignore)) {
            settings[eventType].call(validator, this, event);
          }
        }

        $(this.currentForm).on("focusin.validate focusout.validate keyup.validate", ":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " + "[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " + "[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " + "[type='radio'], [type='checkbox'], [contenteditable], [type='button']", delegate) // Support: Chrome, oldIE
        // "select" is provided as event.target when clicking a option
        .on("click.validate", "select, option, [type='radio'], [type='checkbox']", delegate);

        if (this.settings.invalidHandler) {
          $(this.currentForm).on("invalid-form.validate", this.settings.invalidHandler);
        }
      },
      // https://jqueryvalidation.org/Validator.form/
      form: function form() {
        this.checkForm();
        $.extend(this.submitted, this.errorMap);
        this.invalid = $.extend({}, this.errorMap);

        if (!this.valid()) {
          $(this.currentForm).triggerHandler("invalid-form", [this]);
        }

        this.showErrors();
        return this.valid();
      },
      checkForm: function checkForm() {
        this.prepareForm();

        for (var i = 0, elements = this.currentElements = this.elements(); elements[i]; i++) {
          this.check(elements[i]);
        }

        return this.valid();
      },
      // https://jqueryvalidation.org/Validator.element/
      element: function element(_element) {
        var cleanElement = this.clean(_element),
            checkElement = this.validationTargetFor(cleanElement),
            v = this,
            result = true,
            rs,
            group;

        if (checkElement === undefined) {
          delete this.invalid[cleanElement.name];
        } else {
          this.prepareElement(checkElement);
          this.currentElements = $(checkElement); // If this element is grouped, then validate all group elements already
          // containing a value

          group = this.groups[checkElement.name];

          if (group) {
            $.each(this.groups, function (name, testgroup) {
              if (testgroup === group && name !== checkElement.name) {
                cleanElement = v.validationTargetFor(v.clean(v.findByName(name)));

                if (cleanElement && cleanElement.name in v.invalid) {
                  v.currentElements.push(cleanElement);
                  result = v.check(cleanElement) && result;
                }
              }
            });
          }

          rs = this.check(checkElement) !== false;
          result = result && rs;

          if (rs) {
            this.invalid[checkElement.name] = false;
          } else {
            this.invalid[checkElement.name] = true;
          }

          if (!this.numberOfInvalids()) {
            // Hide error containers on last error
            this.toHide = this.toHide.add(this.containers);
          }

          this.showErrors(); // Add aria-invalid status for screen readers

          $(_element).attr("aria-invalid", !rs);
        }

        return result;
      },
      // https://jqueryvalidation.org/Validator.showErrors/
      showErrors: function showErrors(errors) {
        if (errors) {
          var validator = this; // Add items to error list and map

          $.extend(this.errorMap, errors);
          this.errorList = $.map(this.errorMap, function (message, name) {
            return {
              message: message,
              element: validator.findByName(name)[0]
            };
          }); // Remove items from success list

          this.successList = $.grep(this.successList, function (element) {
            return !(element.name in errors);
          });
        }

        if (this.settings.showErrors) {
          this.settings.showErrors.call(this, this.errorMap, this.errorList);
        } else {
          this.defaultShowErrors();
        }
      },
      // https://jqueryvalidation.org/Validator.resetForm/
      resetForm: function resetForm() {
        if ($.fn.resetForm) {
          $(this.currentForm).resetForm();
        }

        this.invalid = {};
        this.submitted = {};
        this.prepareForm();
        this.hideErrors();
        var elements = this.elements().removeData("previousValue").removeAttr("aria-invalid");
        this.resetElements(elements);
      },
      resetElements: function resetElements(elements) {
        var i;

        if (this.settings.unhighlight) {
          for (i = 0; elements[i]; i++) {
            this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, "");
            this.findByName(elements[i].name).removeClass(this.settings.validClass);
          }
        } else {
          elements.removeClass(this.settings.errorClass).removeClass(this.settings.validClass);
        }
      },
      numberOfInvalids: function numberOfInvalids() {
        return this.objectLength(this.invalid);
      },
      objectLength: function objectLength(obj) {
        /* jshint unused: false */
        var count = 0,
            i;

        for (i in obj) {
          // This check allows counting elements with empty error
          // message as invalid elements
          if (obj[i] !== undefined && obj[i] !== null && obj[i] !== false) {
            count++;
          }
        }

        return count;
      },
      hideErrors: function hideErrors() {
        this.hideThese(this.toHide);
      },
      hideThese: function hideThese(errors) {
        errors.not(this.containers).text("");
        this.addWrapper(errors).hide();
      },
      valid: function valid() {
        return this.size() === 0;
      },
      size: function size() {
        return this.errorList.length;
      },
      focusInvalid: function focusInvalid() {
        if (this.settings.focusInvalid) {
          try {
            $(this.findLastActive() || this.errorList.length && this.errorList[0].element || []).filter(":visible").trigger("focus") // Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
            .trigger("focusin");
          } catch (e) {// Ignore IE throwing errors when focusing hidden elements
          }
        }
      },
      findLastActive: function findLastActive() {
        var lastActive = this.lastActive;
        return lastActive && $.grep(this.errorList, function (n) {
          return n.element.name === lastActive.name;
        }).length === 1 && lastActive;
      },
      elements: function elements() {
        var validator = this,
            rulesCache = {}; // Select all valid inputs inside the form (no submit or reset buttons)

        return $(this.currentForm).find("input, select, textarea, [contenteditable]").not(":submit, :reset, :image, :disabled").not(this.settings.ignore).filter(function () {
          var name = this.name || $(this).attr("name"); // For contenteditable

          var isContentEditable = typeof $(this).attr("contenteditable") !== "undefined" && $(this).attr("contenteditable") !== "false";

          if (!name && validator.settings.debug && window.console) {
            console.error("%o has no name assigned", this);
          } // Set form expando on contenteditable


          if (isContentEditable) {
            this.form = $(this).closest("form")[0];
            this.name = name;
          } // Ignore elements that belong to other/nested forms


          if (this.form !== validator.currentForm) {
            return false;
          } // Select only the first element for each name, and only those with rules specified


          if (name in rulesCache || !validator.objectLength($(this).rules())) {
            return false;
          }

          rulesCache[name] = true;
          return true;
        });
      },
      clean: function clean(selector) {
        return $(selector)[0];
      },
      errors: function errors() {
        var errorClass = this.settings.errorClass.split(" ").join(".");
        return $(this.settings.errorElement + "." + errorClass, this.errorContext);
      },
      resetInternals: function resetInternals() {
        this.successList = [];
        this.errorList = [];
        this.errorMap = {};
        this.toShow = $([]);
        this.toHide = $([]);
      },
      reset: function reset() {
        this.resetInternals();
        this.currentElements = $([]);
      },
      prepareForm: function prepareForm() {
        this.reset();
        this.toHide = this.errors().add(this.containers);
      },
      prepareElement: function prepareElement(element) {
        this.reset();
        this.toHide = this.errorsFor(element);
      },
      elementValue: function elementValue(element) {
        var $element = $(element),
            type = element.type,
            isContentEditable = typeof $element.attr("contenteditable") !== "undefined" && $element.attr("contenteditable") !== "false",
            val,
            idx;

        if (type === "radio" || type === "checkbox") {
          return this.findByName(element.name).filter(":checked").val();
        } else if (type === "number" && typeof element.validity !== "undefined") {
          return element.validity.badInput ? "NaN" : $element.val();
        }

        if (isContentEditable) {
          val = $element.text();
        } else {
          val = $element.val();
        }

        if (type === "file") {
          // Modern browser (chrome & safari)
          if (val.substr(0, 12) === "C:\\fakepath\\") {
            return val.substr(12);
          } // Legacy browsers
          // Unix-based path


          idx = val.lastIndexOf("/");

          if (idx >= 0) {
            return val.substr(idx + 1);
          } // Windows-based path


          idx = val.lastIndexOf("\\");

          if (idx >= 0) {
            return val.substr(idx + 1);
          } // Just the file name


          return val;
        }

        if (typeof val === "string") {
          return val.replace(/\r/g, "");
        }

        return val;
      },
      check: function check(element) {
        element = this.validationTargetFor(this.clean(element));
        var rules = $(element).rules(),
            rulesCount = $.map(rules, function (n, i) {
          return i;
        }).length,
            dependencyMismatch = false,
            val = this.elementValue(element),
            result,
            method,
            rule,
            normalizer; // Prioritize the local normalizer defined for this element over the global one
        // if the former exists, otherwise user the global one in case it exists.

        if (typeof rules.normalizer === "function") {
          normalizer = rules.normalizer;
        } else if (typeof this.settings.normalizer === "function") {
          normalizer = this.settings.normalizer;
        } // If normalizer is defined, then call it to retreive the changed value instead
        // of using the real one.
        // Note that `this` in the normalizer is `element`.


        if (normalizer) {
          val = normalizer.call(element, val); // Delete the normalizer from rules to avoid treating it as a pre-defined method.

          delete rules.normalizer;
        }

        for (method in rules) {
          rule = {
            method: method,
            parameters: rules[method]
          };

          try {
            result = $.validator.methods[method].call(this, val, element, rule.parameters); // If a method indicates that the field is optional and therefore valid,
            // don't mark it as valid when there are no other rules

            if (result === "dependency-mismatch" && rulesCount === 1) {
              dependencyMismatch = true;
              continue;
            }

            dependencyMismatch = false;

            if (result === "pending") {
              this.toHide = this.toHide.not(this.errorsFor(element));
              return;
            }

            if (!result) {
              this.formatAndAdd(element, rule);
              return false;
            }
          } catch (e) {
            if (this.settings.debug && window.console) {
              console.log("Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e);
            }

            if (e instanceof TypeError) {
              e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
            }

            throw e;
          }
        }

        if (dependencyMismatch) {
          return;
        }

        if (this.objectLength(rules)) {
          this.successList.push(element);
        }

        return true;
      },
      // Return the custom message for the given element and validation method
      // specified in the element's HTML5 data attribute
      // return the generic message if present and no method specific message is present
      customDataMessage: function customDataMessage(element, method) {
        return $(element).data("msg" + method.charAt(0).toUpperCase() + method.substring(1).toLowerCase()) || $(element).data("msg");
      },
      // Return the custom message for the given element name and validation method
      customMessage: function customMessage(name, method) {
        var m = this.settings.messages[name];
        return m && (m.constructor === String ? m : m[method]);
      },
      // Return the first defined argument, allowing empty strings
      findDefined: function findDefined() {
        for (var i = 0; i < arguments.length; i++) {
          if (arguments[i] !== undefined) {
            return arguments[i];
          }
        }

        return undefined;
      },
      // The second parameter 'rule' used to be a string, and extended to an object literal
      // of the following form:
      // rule = {
      //     method: "method name",
      //     parameters: "the given method parameters"
      // }
      //
      // The old behavior still supported, kept to maintain backward compatibility with
      // old code, and will be removed in the next major release.
      defaultMessage: function defaultMessage(element, rule) {
        if (typeof rule === "string") {
          rule = {
            method: rule
          };
        }

        var message = this.findDefined(this.customMessage(element.name, rule.method), this.customDataMessage(element, rule.method), // 'title' is never undefined, so handle empty string as undefined
        !this.settings.ignoreTitle && element.title || undefined, $.validator.messages[rule.method], "<strong>Warning: No message defined for " + element.name + "</strong>"),
            theregex = /\$?\{(\d+)\}/g;

        if (typeof message === "function") {
          message = message.call(this, rule.parameters, element);
        } else if (theregex.test(message)) {
          message = $.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
        }

        return message;
      },
      formatAndAdd: function formatAndAdd(element, rule) {
        var message = this.defaultMessage(element, rule);
        this.errorList.push({
          message: message,
          element: element,
          method: rule.method
        });
        this.errorMap[element.name] = message;
        this.submitted[element.name] = message;
      },
      addWrapper: function addWrapper(toToggle) {
        if (this.settings.wrapper) {
          toToggle = toToggle.add(toToggle.parent(this.settings.wrapper));
        }

        return toToggle;
      },
      defaultShowErrors: function defaultShowErrors() {
        var i, elements, error;

        for (i = 0; this.errorList[i]; i++) {
          error = this.errorList[i];

          if (this.settings.highlight) {
            this.settings.highlight.call(this, error.element, this.settings.errorClass, this.settings.validClass);
          }

          this.showLabel(error.element, error.message);
        }

        if (this.errorList.length) {
          this.toShow = this.toShow.add(this.containers);
        }

        if (this.settings.success) {
          for (i = 0; this.successList[i]; i++) {
            this.showLabel(this.successList[i]);
          }
        }

        if (this.settings.unhighlight) {
          for (i = 0, elements = this.validElements(); elements[i]; i++) {
            this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, this.settings.validClass);
          }
        }

        this.toHide = this.toHide.not(this.toShow);
        this.hideErrors();
        this.addWrapper(this.toShow).show();
      },
      validElements: function validElements() {
        return this.currentElements.not(this.invalidElements());
      },
      invalidElements: function invalidElements() {
        return $(this.errorList).map(function () {
          return this.element;
        });
      },
      showLabel: function showLabel(element, message) {
        var place,
            group,
            errorID,
            v,
            error = this.errorsFor(element),
            elementID = this.idOrName(element),
            describedBy = $(element).attr("aria-describedby");

        if (error.length) {
          // Refresh error/success class
          error.removeClass(this.settings.validClass).addClass(this.settings.errorClass); // Replace message on existing label

          error.html(message);
        } else {
          // Create error element
          error = $("<" + this.settings.errorElement + ">").attr("id", elementID + "-error").addClass(this.settings.errorClass).html(message || ""); // Maintain reference to the element to be placed into the DOM

          place = error;

          if (this.settings.wrapper) {
            // Make sure the element is visible, even in IE
            // actually showing the wrapped element is handled elsewhere
            place = error.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
          }

          if (this.labelContainer.length) {
            this.labelContainer.append(place);
          } else if (this.settings.errorPlacement) {
            this.settings.errorPlacement.call(this, place, $(element));
          } else {
            place.insertAfter(element);
          } // Link error back to the element


          if (error.is("label")) {
            // If the error is a label, then associate using 'for'
            error.attr("for", elementID); // If the element is not a child of an associated label, then it's necessary
            // to explicitly apply aria-describedby
          } else if (error.parents("label[for='" + this.escapeCssMeta(elementID) + "']").length === 0) {
            errorID = error.attr("id"); // Respect existing non-error aria-describedby

            if (!describedBy) {
              describedBy = errorID;
            } else if (!describedBy.match(new RegExp("\\b" + this.escapeCssMeta(errorID) + "\\b"))) {
              // Add to end of list if not already present
              describedBy += " " + errorID;
            }

            $(element).attr("aria-describedby", describedBy); // If this element is grouped, then assign to all elements in the same group

            group = this.groups[element.name];

            if (group) {
              v = this;
              $.each(v.groups, function (name, testgroup) {
                if (testgroup === group) {
                  $("[name='" + v.escapeCssMeta(name) + "']", v.currentForm).attr("aria-describedby", error.attr("id"));
                }
              });
            }
          }
        }

        if (!message && this.settings.success) {
          error.text("");

          if (typeof this.settings.success === "string") {
            error.addClass(this.settings.success);
          } else {
            this.settings.success(error, element);
          }
        }

        this.toShow = this.toShow.add(error);
      },
      errorsFor: function errorsFor(element) {
        var name = this.escapeCssMeta(this.idOrName(element)),
            describer = $(element).attr("aria-describedby"),
            selector = "label[for='" + name + "'], label[for='" + name + "'] *"; // 'aria-describedby' should directly reference the error element

        if (describer) {
          selector = selector + ", #" + this.escapeCssMeta(describer).replace(/\s+/g, ", #");
        }

        return this.errors().filter(selector);
      },
      // See https://api.jquery.com/category/selectors/, for CSS
      // meta-characters that should be escaped in order to be used with JQuery
      // as a literal part of a name/id or any selector.
      escapeCssMeta: function escapeCssMeta(string) {
        return string.replace(/([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1");
      },
      idOrName: function idOrName(element) {
        return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
      },
      validationTargetFor: function validationTargetFor(element) {
        // If radio/checkbox, validate first element in group instead
        if (this.checkable(element)) {
          element = this.findByName(element.name);
        } // Always apply ignore filter


        return $(element).not(this.settings.ignore)[0];
      },
      checkable: function checkable(element) {
        return /radio|checkbox/i.test(element.type);
      },
      findByName: function findByName(name) {
        return $(this.currentForm).find("[name='" + this.escapeCssMeta(name) + "']");
      },
      getLength: function getLength(value, element) {
        switch (element.nodeName.toLowerCase()) {
          case "select":
            return $("option:selected", element).length;

          case "input":
            if (this.checkable(element)) {
              return this.findByName(element.name).filter(":checked").length;
            }

        }

        return value.length;
      },
      depend: function depend(param, element) {
        return this.dependTypes[_typeof(param)] ? this.dependTypes[_typeof(param)](param, element) : true;
      },
      dependTypes: {
        "boolean": function boolean(param) {
          return param;
        },
        "string": function string(param, element) {
          return !!$(param, element.form).length;
        },
        "function": function _function(param, element) {
          return param(element);
        }
      },
      optional: function optional(element) {
        var val = this.elementValue(element);
        return !$.validator.methods.required.call(this, val, element) && "dependency-mismatch";
      },
      startRequest: function startRequest(element) {
        if (!this.pending[element.name]) {
          this.pendingRequest++;
          $(element).addClass(this.settings.pendingClass);
          this.pending[element.name] = true;
        }
      },
      stopRequest: function stopRequest(element, valid) {
        this.pendingRequest--; // Sometimes synchronization fails, make sure pendingRequest is never < 0

        if (this.pendingRequest < 0) {
          this.pendingRequest = 0;
        }

        delete this.pending[element.name];
        $(element).removeClass(this.settings.pendingClass);

        if (valid && this.pendingRequest === 0 && this.formSubmitted && this.form()) {
          $(this.currentForm).submit(); // Remove the hidden input that was used as a replacement for the
          // missing submit button. The hidden input is added by `handle()`
          // to ensure that the value of the used submit button is passed on
          // for scripted submits triggered by this method

          if (this.submitButton) {
            $("input:hidden[name='" + this.submitButton.name + "']", this.currentForm).remove();
          }

          this.formSubmitted = false;
        } else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
          $(this.currentForm).triggerHandler("invalid-form", [this]);
          this.formSubmitted = false;
        }
      },
      previousValue: function previousValue(element, method) {
        method = typeof method === "string" && method || "remote";
        return $.data(element, "previousValue") || $.data(element, "previousValue", {
          old: null,
          valid: true,
          message: this.defaultMessage(element, {
            method: method
          })
        });
      },
      // Cleans up all forms and elements, removes validator-specific events
      destroy: function destroy() {
        this.resetForm();
        $(this.currentForm).off(".validate").removeData("validator").find(".validate-equalTo-blur").off(".validate-equalTo").removeClass("validate-equalTo-blur").find(".validate-lessThan-blur").off(".validate-lessThan").removeClass("validate-lessThan-blur").find(".validate-lessThanEqual-blur").off(".validate-lessThanEqual").removeClass("validate-lessThanEqual-blur").find(".validate-greaterThanEqual-blur").off(".validate-greaterThanEqual").removeClass("validate-greaterThanEqual-blur").find(".validate-greaterThan-blur").off(".validate-greaterThan").removeClass("validate-greaterThan-blur");
      }
    },
    classRuleSettings: {
      required: {
        required: true
      },
      email: {
        email: true
      },
      url: {
        url: true
      },
      date: {
        date: true
      },
      dateISO: {
        dateISO: true
      },
      number: {
        number: true
      },
      digits: {
        digits: true
      },
      creditcard: {
        creditcard: true
      }
    },
    addClassRules: function addClassRules(className, rules) {
      if (className.constructor === String) {
        this.classRuleSettings[className] = rules;
      } else {
        $.extend(this.classRuleSettings, className);
      }
    },
    classRules: function classRules(element) {
      var rules = {},
          classes = $(element).attr("class");

      if (classes) {
        $.each(classes.split(" "), function () {
          if (this in $.validator.classRuleSettings) {
            $.extend(rules, $.validator.classRuleSettings[this]);
          }
        });
      }

      return rules;
    },
    normalizeAttributeRule: function normalizeAttributeRule(rules, type, method, value) {
      // Convert the value to a number for number inputs, and for text for backwards compability
      // allows type="date" and others to be compared as strings
      if (/min|max|step/.test(method) && (type === null || /number|range|text/.test(type))) {
        value = Number(value); // Support Opera Mini, which returns NaN for undefined minlength

        if (isNaN(value)) {
          value = undefined;
        }
      }

      if (value || value === 0) {
        rules[method] = value;
      } else if (type === method && type !== "range") {
        // Exception: the jquery validate 'range' method
        // does not test for the html5 'range' type
        rules[method] = true;
      }
    },
    attributeRules: function attributeRules(element) {
      var rules = {},
          $element = $(element),
          type = element.getAttribute("type"),
          method,
          value;

      for (method in $.validator.methods) {
        // Support for <input required> in both html5 and older browsers
        if (method === "required") {
          value = element.getAttribute(method); // Some browsers return an empty string for the required attribute
          // and non-HTML5 browsers might have required="" markup

          if (value === "") {
            value = true;
          } // Force non-HTML5 browsers to return bool


          value = !!value;
        } else {
          value = $element.attr(method);
        }

        this.normalizeAttributeRule(rules, type, method, value);
      } // 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs


      if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
        delete rules.maxlength;
      }

      return rules;
    },
    dataRules: function dataRules(element) {
      var rules = {},
          $element = $(element),
          type = element.getAttribute("type"),
          method,
          value;

      for (method in $.validator.methods) {
        value = $element.data("rule" + method.charAt(0).toUpperCase() + method.substring(1).toLowerCase()); // Cast empty attributes like `data-rule-required` to `true`

        if (value === "") {
          value = true;
        }

        this.normalizeAttributeRule(rules, type, method, value);
      }

      return rules;
    },
    staticRules: function staticRules(element) {
      var rules = {},
          validator = $.data(element.form, "validator");

      if (validator.settings.rules) {
        rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
      }

      return rules;
    },
    normalizeRules: function normalizeRules(rules, element) {
      // Handle dependency check
      $.each(rules, function (prop, val) {
        // Ignore rule when param is explicitly false, eg. required:false
        if (val === false) {
          delete rules[prop];
          return;
        }

        if (val.param || val.depends) {
          var keepRule = true;

          switch (_typeof(val.depends)) {
            case "string":
              keepRule = !!$(val.depends, element.form).length;
              break;

            case "function":
              keepRule = val.depends.call(element, element);
              break;
          }

          if (keepRule) {
            rules[prop] = val.param !== undefined ? val.param : true;
          } else {
            $.data(element.form, "validator").resetElements($(element));
            delete rules[prop];
          }
        }
      }); // Evaluate parameters

      $.each(rules, function (rule, parameter) {
        rules[rule] = typeof parameter === "function" && rule !== "normalizer" ? parameter(element) : parameter;
      }); // Clean number parameters

      $.each(["minlength", "maxlength"], function () {
        if (rules[this]) {
          rules[this] = Number(rules[this]);
        }
      });
      $.each(["rangelength", "range"], function () {
        var parts;

        if (rules[this]) {
          if (Array.isArray(rules[this])) {
            rules[this] = [Number(rules[this][0]), Number(rules[this][1])];
          } else if (typeof rules[this] === "string") {
            parts = rules[this].replace(/[\[\]]/g, "").split(/[\s,]+/);
            rules[this] = [Number(parts[0]), Number(parts[1])];
          }
        }
      });

      if ($.validator.autoCreateRanges) {
        // Auto-create ranges
        if (rules.min != null && rules.max != null) {
          rules.range = [rules.min, rules.max];
          delete rules.min;
          delete rules.max;
        }

        if (rules.minlength != null && rules.maxlength != null) {
          rules.rangelength = [rules.minlength, rules.maxlength];
          delete rules.minlength;
          delete rules.maxlength;
        }
      }

      return rules;
    },
    // Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
    normalizeRule: function normalizeRule(data) {
      if (typeof data === "string") {
        var transformed = {};
        $.each(data.split(/\s/), function () {
          transformed[this] = true;
        });
        data = transformed;
      }

      return data;
    },
    // https://jqueryvalidation.org/jQuery.validator.addMethod/
    addMethod: function addMethod(name, method, message) {
      $.validator.methods[name] = method;
      $.validator.messages[name] = message !== undefined ? message : $.validator.messages[name];

      if (method.length < 3) {
        $.validator.addClassRules(name, $.validator.normalizeRule(name));
      }
    },
    // https://jqueryvalidation.org/jQuery.validator.methods/
    methods: {
      // https://jqueryvalidation.org/required-method/
      required: function required(value, element, param) {
        // Check if dependency is met
        if (!this.depend(param, element)) {
          return "dependency-mismatch";
        }

        if (element.nodeName.toLowerCase() === "select") {
          // Could be an array for select-multiple or a string, both are fine this way
          var val = $(element).val();
          return val && val.length > 0;
        }

        if (this.checkable(element)) {
          return this.getLength(value, element) > 0;
        }

        return value !== undefined && value !== null && value.length > 0;
      },
      // https://jqueryvalidation.org/email-method/
      email: function email(value, element) {
        // From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
        // Retrieved 2014-01-14
        // If you have a problem with this implementation, report a bug against the above spec
        // Or use custom methods to implement your own email validation
        return this.optional(element) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
      },
      // https://jqueryvalidation.org/url-method/
      url: function url(value, element) {
        // Copyright (c) 2010-2013 Diego Perini, MIT licensed
        // https://gist.github.com/dperini/729294
        // see also https://mathiasbynens.be/demo/url-regex
        // modified to allow protocol-relative URLs
        return this.optional(element) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
      },
      // https://jqueryvalidation.org/date-method/
      date: function () {
        var called = false;
        return function (value, element) {
          if (!called) {
            called = true;

            if (this.settings.debug && window.console) {
              console.warn("The `date` method is deprecated and will be removed in version '2.0.0'.\n" + "Please don't use it, since it relies on the Date constructor, which\n" + "behaves very differently across browsers and locales. Use `dateISO`\n" + "instead or one of the locale specific methods in `localizations/`\n" + "and `additional-methods.js`.");
            }
          }

          return this.optional(element) || !/Invalid|NaN/.test(new Date(value).toString());
        };
      }(),
      // https://jqueryvalidation.org/dateISO-method/
      dateISO: function dateISO(value, element) {
        return this.optional(element) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value);
      },
      // https://jqueryvalidation.org/number-method/
      number: function number(value, element) {
        return this.optional(element) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
      },
      // https://jqueryvalidation.org/digits-method/
      digits: function digits(value, element) {
        return this.optional(element) || /^\d+$/.test(value);
      },
      // https://jqueryvalidation.org/minlength-method/
      minlength: function minlength(value, element, param) {
        var length = Array.isArray(value) ? value.length : this.getLength(value, element);
        return this.optional(element) || length >= param;
      },
      // https://jqueryvalidation.org/maxlength-method/
      maxlength: function maxlength(value, element, param) {
        var length = Array.isArray(value) ? value.length : this.getLength(value, element);
        return this.optional(element) || length <= param;
      },
      // https://jqueryvalidation.org/rangelength-method/
      rangelength: function rangelength(value, element, param) {
        var length = Array.isArray(value) ? value.length : this.getLength(value, element);
        return this.optional(element) || length >= param[0] && length <= param[1];
      },
      // https://jqueryvalidation.org/min-method/
      min: function min(value, element, param) {
        return this.optional(element) || value >= param;
      },
      // https://jqueryvalidation.org/max-method/
      max: function max(value, element, param) {
        return this.optional(element) || value <= param;
      },
      // https://jqueryvalidation.org/range-method/
      range: function range(value, element, param) {
        return this.optional(element) || value >= param[0] && value <= param[1];
      },
      // https://jqueryvalidation.org/step-method/
      step: function step(value, element, param) {
        var type = $(element).attr("type"),
            errorMessage = "Step attribute on input type " + type + " is not supported.",
            supportedTypes = ["text", "number", "range"],
            re = new RegExp("\\b" + type + "\\b"),
            notSupported = type && !re.test(supportedTypes.join()),
            decimalPlaces = function decimalPlaces(num) {
          var match = ("" + num).match(/(?:\.(\d+))?$/);

          if (!match) {
            return 0;
          } // Number of digits right of decimal point.


          return match[1] ? match[1].length : 0;
        },
            toInt = function toInt(num) {
          return Math.round(num * Math.pow(10, decimals));
        },
            valid = true,
            decimals; // Works only for text, number and range input types
        // TODO find a way to support input types date, datetime, datetime-local, month, time and week


        if (notSupported) {
          throw new Error(errorMessage);
        }

        decimals = decimalPlaces(param); // Value can't have too many decimals

        if (decimalPlaces(value) > decimals || toInt(value) % toInt(param) !== 0) {
          valid = false;
        }

        return this.optional(element) || valid;
      },
      // https://jqueryvalidation.org/equalTo-method/
      equalTo: function equalTo(value, element, param) {
        // Bind to the blur event of the target in order to revalidate whenever the target field is updated
        var target = $(param);

        if (this.settings.onfocusout && target.not(".validate-equalTo-blur").length) {
          target.addClass("validate-equalTo-blur").on("blur.validate-equalTo", function () {
            $(element).valid();
          });
        }

        return value === target.val();
      },
      // https://jqueryvalidation.org/remote-method/
      remote: function remote(value, element, param, method) {
        if (this.optional(element)) {
          return "dependency-mismatch";
        }

        method = typeof method === "string" && method || "remote";
        var previous = this.previousValue(element, method),
            validator,
            data,
            optionDataString;

        if (!this.settings.messages[element.name]) {
          this.settings.messages[element.name] = {};
        }

        previous.originalMessage = previous.originalMessage || this.settings.messages[element.name][method];
        this.settings.messages[element.name][method] = previous.message;
        param = typeof param === "string" && {
          url: param
        } || param;
        optionDataString = $.param($.extend({
          data: value
        }, param.data));

        if (previous.old === optionDataString) {
          return previous.valid;
        }

        previous.old = optionDataString;
        validator = this;
        this.startRequest(element);
        data = {};
        data[element.name] = value;
        $.ajax($.extend(true, {
          mode: "abort",
          port: "validate" + element.name,
          dataType: "json",
          data: data,
          context: validator.currentForm,
          success: function success(response) {
            var valid = response === true || response === "true",
                errors,
                message,
                submitted;
            validator.settings.messages[element.name][method] = previous.originalMessage;

            if (valid) {
              submitted = validator.formSubmitted;
              validator.resetInternals();
              validator.toHide = validator.errorsFor(element);
              validator.formSubmitted = submitted;
              validator.successList.push(element);
              validator.invalid[element.name] = false;
              validator.showErrors();
            } else {
              errors = {};
              message = response || validator.defaultMessage(element, {
                method: method,
                parameters: value
              });
              errors[element.name] = previous.message = message;
              validator.invalid[element.name] = true;
              validator.showErrors(errors);
            }

            previous.valid = valid;
            validator.stopRequest(element, valid);
          }
        }, param));
        return "pending";
      }
    }
  }); // Ajax mode: abort
  // usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
  // if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

  var pendingRequests = {},
      ajax; // Use a prefilter if available (1.5+)

  if ($.ajaxPrefilter) {
    $.ajaxPrefilter(function (settings, _, xhr) {
      var port = settings.port;

      if (settings.mode === "abort") {
        if (pendingRequests[port]) {
          pendingRequests[port].abort();
        }

        pendingRequests[port] = xhr;
      }
    });
  } else {
    // Proxy ajax
    ajax = $.ajax;

    $.ajax = function (settings) {
      var mode = ("mode" in settings ? settings : $.ajaxSettings).mode,
          port = ("port" in settings ? settings : $.ajaxSettings).port;

      if (mode === "abort") {
        if (pendingRequests[port]) {
          pendingRequests[port].abort();
        }

        pendingRequests[port] = ajax.apply(this, arguments);
        return pendingRequests[port];
      }

      return ajax.apply(this, arguments);
    };
  }

  return $;
});

$(function () {
  $(".js-img").addClass("--active");
});
$(function () {
  $(".js-button").on("click", function (event) {
    event.preventDefault();
    $(this).toggleClass("--hidden");
    $(this).siblings("a").toggleClass("--hidden");
    $(this).parent("div").prev("div").toggleClass("--opened");
  });
});
$(function () {
  $(".js-thumb").on("click", function () {
    var mainImage = $(this).index();
    $(".js-thumb").removeClass("--active");
    $(this).addClass("--active");
    $(".js-main").removeClass("--active");
    $(".js-main").eq(mainImage).addClass("--active");
  });
});
$(function () {
  $(".js-trigger").on("click", function (e) {
    e.preventDefault();
    $(".js-trigger").removeClass("--active");
    $(".js-tab").removeClass("--active");
    $(this).addClass("--active");
    $($(this).attr("href")).addClass("--active");
  });
  var $tabletScreen = 990; // если экран < 990, делает активным второй таб, так как первый скрыт

  if ($(window).width() < $tabletScreen) {
    $(".js-triggers").children(".js-trigger")[1].click();
  } else {
    $(".js-trigger:first").click();
  } // делает активным второй таб при уменьшении окна, и первый - при увеличении


  $(window).on("resize", function () {
    if ($(window).width() < $tabletScreen) {
      $(".js-triggers").children(".js-trigger")[1].click();
    } else {
      $(".js-trigger:first").click();
    }
  });
});
var slider = new Swiper(".js-swiper", {
  slidesPerView: 1,
  spaceBetween: 10,
  speed: 1000,
  pagination: {
    el: ".specials__pagination",
    clickable: true
  },
  breakpoints: {
    560: {
      slidesPerView: 2,
      spaceBetween: 20
    },
    990: {
      slidesPerView: 3,
      spaceBetween: 20
    },
    1200: {
      slidesPerView: 4,
      spaceBetween: 30
    }
  }
});
var slider2 = new Swiper(".js-swiper-2", {
  slidesPerView: 2,
  spaceBetween: 20,
  speed: 1000,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev"
  },
  pagination: {
    el: ".youlike__pagination",
    clickable: true
  },
  breakpoints: {
    560: {
      slidesPerView: 2,
      spaceBetween: 20
    },
    990: {
      slidesPerView: 3,
      spaceBetween: 20
    },
    1200: {
      slidesPerView: 4,
      spaceBetween: 9
    }
  }
});
$(function () {
  $(".js-burger-icon").on("click", function () {
    $("body").toggleClass("--lock");
    $($(this)).toggleClass("--active");
    $(".js-burger-menu").toggleClass("--active");
  });
});
$(function () {
  $(".js-accordion-switch").on("click", function () {
    $(this).next(".js-accordion-list").slideToggle();
    $(this).children("img").toggleClass("--active");
  });
});
$(function () {
  $(".js-fancybox").fancybox({
    touch: false,
    modal: true
  });
});
$(function () {
  $("#js-form").validate({
    rules: {
      name: {
        required: true
      },
      tel: {
        required: true,
        numberValidation: true
      }
    }
  });
  $.validator.addMethod("numberValidation", function (value) {
    return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value);
  }, "Please enter a valid number, starting from +7 or 8");
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVxdWlyZSIsImpRdWVyeSIsIiQiLCJleHRlbmQiLCJmbiIsInZhbGlkYXRlIiwib3B0aW9ucyIsImxlbmd0aCIsImRlYnVnIiwid2luZG93IiwiY29uc29sZSIsIndhcm4iLCJ2YWxpZGF0b3IiLCJkYXRhIiwiYXR0ciIsInNldHRpbmdzIiwib25zdWJtaXQiLCJvbiIsImV2ZW50Iiwic3VibWl0QnV0dG9uIiwiY3VycmVudFRhcmdldCIsImhhc0NsYXNzIiwiY2FuY2VsU3VibWl0IiwidW5kZWZpbmVkIiwicHJldmVudERlZmF1bHQiLCJoYW5kbGUiLCJoaWRkZW4iLCJyZXN1bHQiLCJzdWJtaXRIYW5kbGVyIiwiZm9ybVN1Ym1pdHRlZCIsIm5hbWUiLCJ2YWwiLCJhcHBlbmRUbyIsImN1cnJlbnRGb3JtIiwiY2FsbCIsInJlbW92ZSIsImZvcm0iLCJwZW5kaW5nUmVxdWVzdCIsImZvY3VzSW52YWxpZCIsInZhbGlkIiwiZXJyb3JMaXN0IiwiaXMiLCJlYWNoIiwiZWxlbWVudCIsImNvbmNhdCIsInJ1bGVzIiwiY29tbWFuZCIsImFyZ3VtZW50IiwiaXNDb250ZW50RWRpdGFibGUiLCJzdGF0aWNSdWxlcyIsImV4aXN0aW5nUnVsZXMiLCJwYXJhbSIsImZpbHRlcmVkIiwiY2xvc2VzdCIsIm5vcm1hbGl6ZVJ1bGUiLCJtZXNzYWdlcyIsInNwbGl0IiwiaW5kZXgiLCJtZXRob2QiLCJub3JtYWxpemVSdWxlcyIsImNsYXNzUnVsZXMiLCJhdHRyaWJ1dGVSdWxlcyIsImRhdGFSdWxlcyIsInJlcXVpcmVkIiwicmVtb3RlIiwidHJpbSIsInN0ciIsInJlcGxhY2UiLCJleHByIiwicHNldWRvcyIsImJsYW5rIiwiYSIsImZpbGxlZCIsInVuY2hlY2tlZCIsInByb3AiLCJkZWZhdWx0cyIsImluaXQiLCJmb3JtYXQiLCJzb3VyY2UiLCJwYXJhbXMiLCJhcmd1bWVudHMiLCJhcmdzIiwibWFrZUFycmF5IiwidW5zaGlmdCIsImFwcGx5IiwiY29uc3RydWN0b3IiLCJBcnJheSIsInNsaWNlIiwiaSIsIm4iLCJSZWdFeHAiLCJncm91cHMiLCJlcnJvckNsYXNzIiwicGVuZGluZ0NsYXNzIiwidmFsaWRDbGFzcyIsImVycm9yRWxlbWVudCIsImZvY3VzQ2xlYW51cCIsImVycm9yQ29udGFpbmVyIiwiZXJyb3JMYWJlbENvbnRhaW5lciIsImlnbm9yZSIsImlnbm9yZVRpdGxlIiwib25mb2N1c2luIiwibGFzdEFjdGl2ZSIsInVuaGlnaGxpZ2h0IiwiaGlkZVRoZXNlIiwiZXJyb3JzRm9yIiwib25mb2N1c291dCIsImNoZWNrYWJsZSIsInN1Ym1pdHRlZCIsIm9wdGlvbmFsIiwib25rZXl1cCIsImV4Y2x1ZGVkS2V5cyIsIndoaWNoIiwiZWxlbWVudFZhbHVlIiwiaW5BcnJheSIsImtleUNvZGUiLCJpbnZhbGlkIiwib25jbGljayIsInBhcmVudE5vZGUiLCJoaWdobGlnaHQiLCJ0eXBlIiwiZmluZEJ5TmFtZSIsImFkZENsYXNzIiwicmVtb3ZlQ2xhc3MiLCJzZXREZWZhdWx0cyIsImVtYWlsIiwidXJsIiwiZGF0ZSIsImRhdGVJU08iLCJudW1iZXIiLCJkaWdpdHMiLCJlcXVhbFRvIiwibWF4bGVuZ3RoIiwibWlubGVuZ3RoIiwicmFuZ2VsZW5ndGgiLCJyYW5nZSIsIm1heCIsIm1pbiIsInN0ZXAiLCJhdXRvQ3JlYXRlUmFuZ2VzIiwicHJvdG90eXBlIiwibGFiZWxDb250YWluZXIiLCJlcnJvckNvbnRleHQiLCJjb250YWluZXJzIiwiYWRkIiwidmFsdWVDYWNoZSIsInBlbmRpbmciLCJyZXNldCIsImtleSIsInZhbHVlIiwiZGVsZWdhdGUiLCJldmVudFR5cGUiLCJpbnZhbGlkSGFuZGxlciIsImNoZWNrRm9ybSIsImVycm9yTWFwIiwidHJpZ2dlckhhbmRsZXIiLCJzaG93RXJyb3JzIiwicHJlcGFyZUZvcm0iLCJlbGVtZW50cyIsImN1cnJlbnRFbGVtZW50cyIsImNoZWNrIiwiY2xlYW5FbGVtZW50IiwiY2xlYW4iLCJjaGVja0VsZW1lbnQiLCJ2YWxpZGF0aW9uVGFyZ2V0Rm9yIiwidiIsInJzIiwiZ3JvdXAiLCJwcmVwYXJlRWxlbWVudCIsInRlc3Rncm91cCIsInB1c2giLCJudW1iZXJPZkludmFsaWRzIiwidG9IaWRlIiwiZXJyb3JzIiwibWFwIiwibWVzc2FnZSIsInN1Y2Nlc3NMaXN0IiwiZ3JlcCIsImRlZmF1bHRTaG93RXJyb3JzIiwicmVzZXRGb3JtIiwiaGlkZUVycm9ycyIsInJlbW92ZURhdGEiLCJyZW1vdmVBdHRyIiwicmVzZXRFbGVtZW50cyIsIm9iamVjdExlbmd0aCIsIm9iaiIsImNvdW50Iiwibm90IiwidGV4dCIsImFkZFdyYXBwZXIiLCJoaWRlIiwic2l6ZSIsImZpbmRMYXN0QWN0aXZlIiwiZmlsdGVyIiwidHJpZ2dlciIsImUiLCJydWxlc0NhY2hlIiwiZmluZCIsImVycm9yIiwic2VsZWN0b3IiLCJqb2luIiwicmVzZXRJbnRlcm5hbHMiLCJ0b1Nob3ciLCIkZWxlbWVudCIsImlkeCIsInZhbGlkaXR5IiwiYmFkSW5wdXQiLCJzdWJzdHIiLCJsYXN0SW5kZXhPZiIsInJ1bGVzQ291bnQiLCJkZXBlbmRlbmN5TWlzbWF0Y2giLCJydWxlIiwibm9ybWFsaXplciIsInBhcmFtZXRlcnMiLCJtZXRob2RzIiwiZm9ybWF0QW5kQWRkIiwibG9nIiwiaWQiLCJUeXBlRXJyb3IiLCJjdXN0b21EYXRhTWVzc2FnZSIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic3Vic3RyaW5nIiwidG9Mb3dlckNhc2UiLCJjdXN0b21NZXNzYWdlIiwibSIsIlN0cmluZyIsImZpbmREZWZpbmVkIiwiZGVmYXVsdE1lc3NhZ2UiLCJ0aXRsZSIsInRoZXJlZ2V4IiwidGVzdCIsInRvVG9nZ2xlIiwid3JhcHBlciIsInBhcmVudCIsInNob3dMYWJlbCIsInN1Y2Nlc3MiLCJ2YWxpZEVsZW1lbnRzIiwic2hvdyIsImludmFsaWRFbGVtZW50cyIsInBsYWNlIiwiZXJyb3JJRCIsImVsZW1lbnRJRCIsImlkT3JOYW1lIiwiZGVzY3JpYmVkQnkiLCJodG1sIiwid3JhcCIsImFwcGVuZCIsImVycm9yUGxhY2VtZW50IiwiaW5zZXJ0QWZ0ZXIiLCJwYXJlbnRzIiwiZXNjYXBlQ3NzTWV0YSIsIm1hdGNoIiwiZGVzY3JpYmVyIiwic3RyaW5nIiwiZ2V0TGVuZ3RoIiwibm9kZU5hbWUiLCJkZXBlbmQiLCJkZXBlbmRUeXBlcyIsInN0YXJ0UmVxdWVzdCIsInN0b3BSZXF1ZXN0Iiwic3VibWl0IiwicHJldmlvdXNWYWx1ZSIsIm9sZCIsImRlc3Ryb3kiLCJvZmYiLCJjbGFzc1J1bGVTZXR0aW5ncyIsImNyZWRpdGNhcmQiLCJhZGRDbGFzc1J1bGVzIiwiY2xhc3NOYW1lIiwiY2xhc3NlcyIsIm5vcm1hbGl6ZUF0dHJpYnV0ZVJ1bGUiLCJOdW1iZXIiLCJpc05hTiIsImdldEF0dHJpYnV0ZSIsImRlcGVuZHMiLCJrZWVwUnVsZSIsInBhcmFtZXRlciIsInBhcnRzIiwiaXNBcnJheSIsInRyYW5zZm9ybWVkIiwiYWRkTWV0aG9kIiwiY2FsbGVkIiwiRGF0ZSIsInRvU3RyaW5nIiwiZXJyb3JNZXNzYWdlIiwic3VwcG9ydGVkVHlwZXMiLCJyZSIsIm5vdFN1cHBvcnRlZCIsImRlY2ltYWxQbGFjZXMiLCJudW0iLCJ0b0ludCIsIk1hdGgiLCJyb3VuZCIsInBvdyIsImRlY2ltYWxzIiwiRXJyb3IiLCJ0YXJnZXQiLCJwcmV2aW91cyIsIm9wdGlvbkRhdGFTdHJpbmciLCJvcmlnaW5hbE1lc3NhZ2UiLCJhamF4IiwibW9kZSIsInBvcnQiLCJkYXRhVHlwZSIsImNvbnRleHQiLCJyZXNwb25zZSIsInBlbmRpbmdSZXF1ZXN0cyIsImFqYXhQcmVmaWx0ZXIiLCJfIiwieGhyIiwiYWJvcnQiLCJhamF4U2V0dGluZ3MiLCJ0b2dnbGVDbGFzcyIsInNpYmxpbmdzIiwicHJldiIsIm1haW5JbWFnZSIsImVxIiwiJHRhYmxldFNjcmVlbiIsIndpZHRoIiwiY2hpbGRyZW4iLCJjbGljayIsInNsaWRlciIsIlN3aXBlciIsInNsaWRlc1BlclZpZXciLCJzcGFjZUJldHdlZW4iLCJzcGVlZCIsInBhZ2luYXRpb24iLCJlbCIsImNsaWNrYWJsZSIsImJyZWFrcG9pbnRzIiwic2xpZGVyMiIsIm5hdmlnYXRpb24iLCJuZXh0RWwiLCJwcmV2RWwiLCJuZXh0Iiwic2xpZGVUb2dnbGUiLCJmYW5jeWJveCIsInRvdWNoIiwibW9kYWwiLCJ0ZWwiLCJudW1iZXJWYWxpZGF0aW9uIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNDLFdBQVVBLE9BQVYsRUFBb0I7QUFDcEIsTUFBSyxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxNQUFNLENBQUNDLEdBQTVDLEVBQWtEO0FBQ2pERCxJQUFBQSxNQUFNLENBQUUsQ0FBQyxRQUFELENBQUYsRUFBY0QsT0FBZCxDQUFOO0FBQ0EsR0FGRCxNQUVPLElBQUksUUFBT0csTUFBUCx5Q0FBT0EsTUFBUCxPQUFrQixRQUFsQixJQUE4QkEsTUFBTSxDQUFDQyxPQUF6QyxFQUFrRDtBQUN4REQsSUFBQUEsTUFBTSxDQUFDQyxPQUFQLEdBQWlCSixPQUFPLENBQUVLLE9BQU8sQ0FBRSxRQUFGLENBQVQsQ0FBeEI7QUFDQSxHQUZNLE1BRUE7QUFDTkwsSUFBQUEsT0FBTyxDQUFFTSxNQUFGLENBQVA7QUFDQTtBQUNELENBUkEsRUFRQyxVQUFVQyxDQUFWLEVBQWM7QUFFaEJBLEVBQUFBLENBQUMsQ0FBQ0MsTUFBRixDQUFVRCxDQUFDLENBQUNFLEVBQVosRUFBZ0I7QUFFZjtBQUNBQyxJQUFBQSxRQUFRLEVBQUUsa0JBQVVDLE9BQVYsRUFBb0I7QUFFN0I7QUFDQSxVQUFLLENBQUMsS0FBS0MsTUFBWCxFQUFvQjtBQUNuQixZQUFLRCxPQUFPLElBQUlBLE9BQU8sQ0FBQ0UsS0FBbkIsSUFBNEJDLE1BQU0sQ0FBQ0MsT0FBeEMsRUFBa0Q7QUFDakRBLFVBQUFBLE9BQU8sQ0FBQ0MsSUFB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LEVBQUFBLENBQUMsQ0FBQ1UsU0FBRixDQUFZNlEsU0FBWixDQUNFLGtCQURGLEVBRUUsVUFBVXBJLEtBQVYsRUFBaUI7QUFDZixXQUFPLHFEQUFxRGtGLElBQXJELENBQTBEbEYsS0FBMUQsQ0FBUDtBQUNELEdBSkgsRUFLRSxvREFMRjtBQU9ELENBbkJBLENBQUQiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXHJcbiAqIGpRdWVyeSBWYWxpZGF0aW9uIFBsdWdpbiB2MS4xOS4zXHJcbiAqXHJcbiAqIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAyMSBKw7ZybiBaYWVmZmVyZXJcclxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXHJcbiAqL1xyXG4oZnVuY3Rpb24oIGZhY3RvcnkgKSB7XHJcblx0aWYgKCB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCApIHtcclxuXHRcdGRlZmluZSggW1wianF1ZXJ5XCJdLCBmYWN0b3J5ICk7XHJcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoIHJlcXVpcmUoIFwianF1ZXJ5XCIgKSApO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRmYWN0b3J5KCBqUXVlcnkgKTtcclxuXHR9XHJcbn0oZnVuY3Rpb24oICQgKSB7XHJcblxyXG4kLmV4dGVuZCggJC5mbiwge1xyXG5cclxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3ZhbGlkYXRlL1xyXG5cdHZhbGlkYXRlOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcclxuXHJcblx0XHQvLyBJZiBub3RoaW5nIGlzIHNlbGVjdGVkLCByZXR1cm4gbm90aGluZzsgY2FuJ3QgY2hhaW4gYW55d2F5XHJcblx0XHRpZiAoICF0aGlzLmxlbmd0aCApIHtcclxuXHRcdFx0aWYgKCBvcHRpb25zICYmIG9wdGlvbnMuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKCBcIk5vdGhpbmcgc2VsZWN0ZWQsIGNhbid0IHZhbGlkYXRlLCByZXR1cm5pbmcgbm90aGluZy5cIiApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBDaGVjayBpZiBhIHZhbGlkYXRvciBmb3IgdGhpcyBmb3JtIHdhcyBhbHJlYWR5IGNyZWF0ZWRcclxuXHRcdHZhciB2YWxpZGF0b3IgPSAkLmRhdGEoIHRoaXNbIDAgXSwgXCJ2YWxpZGF0b3JcIiApO1xyXG5cdFx0aWYgKCB2YWxpZGF0b3IgKSB7XHJcblx0XHRcdHJldHVybiB2YWxpZGF0b3I7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQWRkIG5vdmFsaWRhdGUgdGFnIGlmIEhUTUw1LlxyXG5cdFx0dGhpcy5hdHRyKCBcIm5vdmFsaWRhdGVcIiwgXCJub3ZhbGlkYXRlXCIgKTtcclxuXHJcblx0XHR2YWxpZGF0b3IgPSBuZXcgJC52YWxpZGF0b3IoIG9wdGlvbnMsIHRoaXNbIDAgXSApO1xyXG5cdFx0JC5kYXRhKCB0aGlzWyAwIF0sIFwidmFsaWRhdG9yXCIsIHZhbGlkYXRvciApO1xyXG5cclxuXHRcdGlmICggdmFsaWRhdG9yLnNldHRpbmdzLm9uc3VibWl0ICkge1xyXG5cclxuXHRcdFx0dGhpcy5vbiggXCJjbGljay52YWxpZGF0ZVwiLCBcIjpzdWJtaXRcIiwgZnVuY3Rpb24oIGV2ZW50ICkge1xyXG5cclxuXHRcdFx0XHQvLyBUcmFjayB0aGUgdXNlZCBzdWJtaXQgYnV0dG9uIHRvIHByb3Blcmx5IGhhbmRsZSBzY3JpcHRlZFxyXG5cdFx0XHRcdC8vIHN1Ym1pdHMgbGF0ZXIuXHJcblx0XHRcdFx0dmFsaWRhdG9yLnN1Ym1pdEJ1dHRvbiA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblxyXG5cdFx0XHRcdC8vIEFsbG93IHN1cHByZXNzaW5nIHZhbGlkYXRpb24gYnkgYWRkaW5nIGEgY2FuY2VsIGNsYXNzIHRvIHRoZSBzdWJtaXQgYnV0dG9uXHJcblx0XHRcdFx0aWYgKCAkKCB0aGlzICkuaGFzQ2xhc3MoIFwiY2FuY2VsXCIgKSApIHtcclxuXHRcdFx0XHRcdHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gQWxsb3cgc3VwcHJlc3NpbmcgdmFsaWRhdGlvbiBieSBhZGRpbmcgdGhlIGh0bWw1IGZvcm1ub3ZhbGlkYXRlIGF0dHJpYnV0ZSB0byB0aGUgc3VibWl0IGJ1dHRvblxyXG5cdFx0XHRcdGlmICggJCggdGhpcyApLmF0dHIoIFwiZm9ybW5vdmFsaWRhdGVcIiApICE9PSB1bmRlZmluZWQgKSB7XHJcblx0XHRcdFx0XHR2YWxpZGF0b3IuY2FuY2VsU3VibWl0ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gKTtcclxuXHJcblx0XHRcdC8vIFZhbGlkYXRlIHRoZSBmb3JtIG9uIHN1Ym1pdFxyXG5cdFx0XHR0aGlzLm9uKCBcInN1Ym1pdC52YWxpZGF0ZVwiLCBmdW5jdGlvbiggZXZlbnQgKSB7XHJcblx0XHRcdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3MuZGVidWcgKSB7XHJcblxyXG5cdFx0XHRcdFx0Ly8gUHJldmVudCBmb3JtIHN1Ym1pdCB0byBiZSBhYmxlIHRvIHNlZSBjb25zb2xlIG91dHB1dFxyXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIGhhbmRsZSgpIHtcclxuXHRcdFx0XHRcdHZhciBoaWRkZW4sIHJlc3VsdDtcclxuXHJcblx0XHRcdFx0XHQvLyBJbnNlcnQgYSBoaWRkZW4gaW5wdXQgYXMgYSByZXBsYWNlbWVudCBmb3IgdGhlIG1pc3Npbmcgc3VibWl0IGJ1dHRvblxyXG5cdFx0XHRcdFx0Ly8gVGhlIGhpZGRlbiBpbnB1dCBpcyBpbnNlcnRlZCBpbiB0d28gY2FzZXM6XHJcblx0XHRcdFx0XHQvLyAgIC0gQSB1c2VyIGRlZmluZWQgYSBgc3VibWl0SGFuZGxlcmBcclxuXHRcdFx0XHRcdC8vICAgLSBUaGVyZSB3YXMgYSBwZW5kaW5nIHJlcXVlc3QgZHVlIHRvIGByZW1vdGVgIG1ldGhvZCBhbmQgYHN0b3BSZXF1ZXN0KClgXHJcblx0XHRcdFx0XHQvLyAgICAgd2FzIGNhbGxlZCB0byBzdWJtaXQgdGhlIGZvcm0gaW4gY2FzZSBpdCdzIHZhbGlkXHJcblx0XHRcdFx0XHRpZiAoIHZhbGlkYXRvci5zdWJtaXRCdXR0b24gJiYgKCB2YWxpZGF0b3Iuc2V0dGluZ3Muc3VibWl0SGFuZGxlciB8fCB2YWxpZGF0b3IuZm9ybVN1Ym1pdHRlZCApICkge1xyXG5cdFx0XHRcdFx0XHRoaWRkZW4gPSAkKCBcIjxpbnB1dCB0eXBlPSdoaWRkZW4nLz5cIiApXHJcblx0XHRcdFx0XHRcdFx0LmF0dHIoIFwibmFtZVwiLCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uLm5hbWUgKVxyXG5cdFx0XHRcdFx0XHRcdC52YWwoICQoIHZhbGlkYXRvci5zdWJtaXRCdXR0b24gKS52YWwoKSApXHJcblx0XHRcdFx0XHRcdFx0LmFwcGVuZFRvKCB2YWxpZGF0b3IuY3VycmVudEZvcm0gKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpZiAoIHZhbGlkYXRvci5zZXR0aW5ncy5zdWJtaXRIYW5kbGVyICYmICF2YWxpZGF0b3Iuc2V0dGluZ3MuZGVidWcgKSB7XHJcblx0XHRcdFx0XHRcdHJlc3VsdCA9IHZhbGlkYXRvci5zZXR0aW5ncy5zdWJtaXRIYW5kbGVyLmNhbGwoIHZhbGlkYXRvciwgdmFsaWRhdG9yLmN1cnJlbnRGb3JtLCBldmVudCApO1xyXG5cdFx0XHRcdFx0XHRpZiAoIGhpZGRlbiApIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0Ly8gQW5kIGNsZWFuIHVwIGFmdGVyd2FyZHM7IHRoYW5rcyB0byBuby1ibG9jay1zY29wZSwgaGlkZGVuIGNhbiBiZSByZWZlcmVuY2VkXHJcblx0XHRcdFx0XHRcdFx0aGlkZGVuLnJlbW92ZSgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGlmICggcmVzdWx0ICE9PSB1bmRlZmluZWQgKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vIFByZXZlbnQgc3VibWl0IGZvciBpbnZhbGlkIGZvcm1zIG9yIGN1c3RvbSBzdWJtaXQgaGFuZGxlcnNcclxuXHRcdFx0XHRpZiAoIHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgKSB7XHJcblx0XHRcdFx0XHR2YWxpZGF0b3IuY2FuY2VsU3VibWl0ID0gZmFsc2U7XHJcblx0XHRcdFx0XHRyZXR1cm4gaGFuZGxlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggdmFsaWRhdG9yLmZvcm0oKSApIHtcclxuXHRcdFx0XHRcdGlmICggdmFsaWRhdG9yLnBlbmRpbmdSZXF1ZXN0ICkge1xyXG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IuZm9ybVN1Ym1pdHRlZCA9IHRydWU7XHJcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBoYW5kbGUoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dmFsaWRhdG9yLmZvY3VzSW52YWxpZCgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB2YWxpZGF0b3I7XHJcblx0fSxcclxuXHJcblx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy92YWxpZC9cclxuXHR2YWxpZDogZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdmFsaWQsIHZhbGlkYXRvciwgZXJyb3JMaXN0O1xyXG5cclxuXHRcdGlmICggJCggdGhpc1sgMCBdICkuaXMoIFwiZm9ybVwiICkgKSB7XHJcblx0XHRcdHZhbGlkID0gdGhpcy52YWxpZGF0ZSgpLmZvcm0oKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGVycm9yTGlzdCA9IFtdO1xyXG5cdFx0XHR2YWxpZCA9IHRydWU7XHJcblx0XHRcdHZhbGlkYXRvciA9ICQoIHRoaXNbIDAgXS5mb3JtICkudmFsaWRhdGUoKTtcclxuXHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YWxpZCA9IHZhbGlkYXRvci5lbGVtZW50KCB0aGlzICkgJiYgdmFsaWQ7XHJcblx0XHRcdFx0aWYgKCAhdmFsaWQgKSB7XHJcblx0XHRcdFx0XHRlcnJvckxpc3QgPSBlcnJvckxpc3QuY29uY2F0KCB2YWxpZGF0b3IuZXJyb3JMaXN0ICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9ICk7XHJcblx0XHRcdHZhbGlkYXRvci5lcnJvckxpc3QgPSBlcnJvckxpc3Q7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdmFsaWQ7XHJcblx0fSxcclxuXHJcblx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9ydWxlcy9cclxuXHRydWxlczogZnVuY3Rpb24oIGNvbW1hbmQsIGFyZ3VtZW50ICkge1xyXG5cdFx0dmFyIGVsZW1lbnQgPSB0aGlzWyAwIF0sXHJcblx0XHRcdGlzQ29udGVudEVkaXRhYmxlID0gdHlwZW9mIHRoaXMuYXR0ciggXCJjb250ZW50ZWRpdGFibGVcIiApICE9PSBcInVuZGVmaW5lZFwiICYmIHRoaXMuYXR0ciggXCJjb250ZW50ZWRpdGFibGVcIiApICE9PSBcImZhbHNlXCIsXHJcblx0XHRcdHNldHRpbmdzLCBzdGF0aWNSdWxlcywgZXhpc3RpbmdSdWxlcywgZGF0YSwgcGFyYW0sIGZpbHRlcmVkO1xyXG5cclxuXHRcdC8vIElmIG5vdGhpbmcgaXMgc2VsZWN0ZWQsIHJldHVybiBlbXB0eSBvYmplY3Q7IGNhbid0IGNoYWluIGFueXdheVxyXG5cdFx0aWYgKCBlbGVtZW50ID09IG51bGwgKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoICFlbGVtZW50LmZvcm0gJiYgaXNDb250ZW50RWRpdGFibGUgKSB7XHJcblx0XHRcdGVsZW1lbnQuZm9ybSA9IHRoaXMuY2xvc2VzdCggXCJmb3JtXCIgKVsgMCBdO1xyXG5cdFx0XHRlbGVtZW50Lm5hbWUgPSB0aGlzLmF0dHIoIFwibmFtZVwiICk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCBlbGVtZW50LmZvcm0gPT0gbnVsbCApIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICggY29tbWFuZCApIHtcclxuXHRcdFx0c2V0dGluZ3MgPSAkLmRhdGEoIGVsZW1lbnQuZm9ybSwgXCJ2YWxpZGF0b3JcIiApLnNldHRpbmdzO1xyXG5cdFx0XHRzdGF0aWNSdWxlcyA9IHNldHRpbmdzLnJ1bGVzO1xyXG5cdFx0XHRleGlzdGluZ1J1bGVzID0gJC52YWxpZGF0b3Iuc3RhdGljUnVsZXMoIGVsZW1lbnQgKTtcclxuXHRcdFx0c3dpdGNoICggY29tbWFuZCApIHtcclxuXHRcdFx0Y2FzZSBcImFkZFwiOlxyXG5cdFx0XHRcdCQuZXh0ZW5kKCBleGlzdGluZ1J1bGVzLCAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCBhcmd1bWVudCApICk7XHJcblxyXG5cdFx0XHRcdC8vIFJlbW92ZSBtZXNzYWdlcyBmcm9tIHJ1bGVzLCBidXQgYWxsb3cgdGhlbSB0byBiZSBzZXQgc2VwYXJhdGVseVxyXG5cdFx0XHRcdGRlbGV0ZSBleGlzdGluZ1J1bGVzLm1lc3NhZ2VzO1xyXG5cdFx0XHRcdHN0YXRpY1J1bGVzWyBlbGVtZW50Lm5hbWUgXSA9IGV4aXN0aW5nUnVsZXM7XHJcblx0XHRcdFx0aWYgKCBhcmd1bWVudC5tZXNzYWdlcyApIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSA9ICQuZXh0ZW5kKCBzZXR0aW5ncy5tZXNzYWdlc1sgZWxlbWVudC5uYW1lIF0sIGFyZ3VtZW50Lm1lc3NhZ2VzICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlIFwicmVtb3ZlXCI6XHJcblx0XHRcdFx0aWYgKCAhYXJndW1lbnQgKSB7XHJcblx0XHRcdFx0XHRkZWxldGUgc3RhdGljUnVsZXNbIGVsZW1lbnQubmFtZSBdO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGV4aXN0aW5nUnVsZXM7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZpbHRlcmVkID0ge307XHJcblx0XHRcdFx0JC5lYWNoKCBhcmd1bWVudC5zcGxpdCggL1xccy8gKSwgZnVuY3Rpb24oIGluZGV4LCBtZXRob2QgKSB7XHJcblx0XHRcdFx0XHRmaWx0ZXJlZFsgbWV0aG9kIF0gPSBleGlzdGluZ1J1bGVzWyBtZXRob2QgXTtcclxuXHRcdFx0XHRcdGRlbGV0ZSBleGlzdGluZ1J1bGVzWyBtZXRob2QgXTtcclxuXHRcdFx0XHR9ICk7XHJcblx0XHRcdFx0cmV0dXJuIGZpbHRlcmVkO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZGF0YSA9ICQudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGVzKFxyXG5cdFx0JC5leHRlbmQoXHJcblx0XHRcdHt9LFxyXG5cdFx0XHQkLnZhbGlkYXRvci5jbGFzc1J1bGVzKCBlbGVtZW50ICksXHJcblx0XHRcdCQudmFsaWRhdG9yLmF0dHJpYnV0ZVJ1bGVzKCBlbGVtZW50ICksXHJcblx0XHRcdCQudmFsaWRhdG9yLmRhdGFSdWxlcyggZWxlbWVudCApLFxyXG5cdFx0XHQkLnZhbGlkYXRvci5zdGF0aWNSdWxlcyggZWxlbWVudCApXHJcblx0XHQpLCBlbGVtZW50ICk7XHJcblxyXG5cdFx0Ly8gTWFrZSBzdXJlIHJlcXVpcmVkIGlzIGF0IGZyb250XHJcblx0XHRpZiAoIGRhdGEucmVxdWlyZWQgKSB7XHJcblx0XHRcdHBhcmFtID0gZGF0YS5yZXF1aXJlZDtcclxuXHRcdFx0ZGVsZXRlIGRhdGEucmVxdWlyZWQ7XHJcblx0XHRcdGRhdGEgPSAkLmV4dGVuZCggeyByZXF1aXJlZDogcGFyYW0gfSwgZGF0YSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIE1ha2Ugc3VyZSByZW1vdGUgaXMgYXQgYmFja1xyXG5cdFx0aWYgKCBkYXRhLnJlbW90ZSApIHtcclxuXHRcdFx0cGFyYW0gPSBkYXRhLnJlbW90ZTtcclxuXHRcdFx0ZGVsZXRlIGRhdGEucmVtb3RlO1xyXG5cdFx0XHRkYXRhID0gJC5leHRlbmQoIGRhdGEsIHsgcmVtb3RlOiBwYXJhbSB9ICk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fVxyXG59ICk7XHJcblxyXG4vLyBKUXVlcnkgdHJpbSBpcyBkZXByZWNhdGVkLCBwcm92aWRlIGEgdHJpbSBtZXRob2QgYmFzZWQgb24gU3RyaW5nLnByb3RvdHlwZS50cmltXHJcbnZhciB0cmltID0gZnVuY3Rpb24oIHN0ciApIHtcclxuXHJcblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL3RyaW0jUG9seWZpbGxcclxuXHRyZXR1cm4gc3RyLnJlcGxhY2UoIC9eW1xcc1xcdUZFRkZcXHhBMF0rfFtcXHNcXHVGRUZGXFx4QTBdKyQvZywgXCJcIiApO1xyXG59O1xyXG5cclxuLy8gQ3VzdG9tIHNlbGVjdG9yc1xyXG4kLmV4dGVuZCggJC5leHByLnBzZXVkb3MgfHwgJC5leHByWyBcIjpcIiBdLCB7XHRcdC8vICd8fCAkLmV4cHJbIFwiOlwiIF0nIGhlcmUgZW5hYmxlcyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB0byBqUXVlcnkgMS43LiBDYW4gYmUgcmVtb3ZlZCB3aGVuIGRyb3BwaW5nIGpRIDEuNy54IHN1cHBvcnRcclxuXHJcblx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9ibGFuay1zZWxlY3Rvci9cclxuXHRibGFuazogZnVuY3Rpb24oIGEgKSB7XHJcblx0XHRyZXR1cm4gIXRyaW0oIFwiXCIgKyAkKCBhICkudmFsKCkgKTtcclxuXHR9LFxyXG5cclxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2ZpbGxlZC1zZWxlY3Rvci9cclxuXHRmaWxsZWQ6IGZ1bmN0aW9uKCBhICkge1xyXG5cdFx0dmFyIHZhbCA9ICQoIGEgKS52YWwoKTtcclxuXHRcdHJldHVybiB2YWwgIT09IG51bGwgJiYgISF0cmltKCBcIlwiICsgdmFsICk7XHJcblx0fSxcclxuXHJcblx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy91bmNoZWNrZWQtc2VsZWN0b3IvXHJcblx0dW5jaGVja2VkOiBmdW5jdGlvbiggYSApIHtcclxuXHRcdHJldHVybiAhJCggYSApLnByb3AoIFwiY2hlY2tlZFwiICk7XHJcblx0fVxyXG59ICk7XHJcblxyXG4vLyBDb25zdHJ1Y3RvciBmb3IgdmFsaWRhdG9yXHJcbiQudmFsaWRhdG9yID0gZnVuY3Rpb24oIG9wdGlvbnMsIGZvcm0gKSB7XHJcblx0dGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKCB0cnVlLCB7fSwgJC52YWxpZGF0b3IuZGVmYXVsdHMsIG9wdGlvbnMgKTtcclxuXHR0aGlzLmN1cnJlbnRGb3JtID0gZm9ybTtcclxuXHR0aGlzLmluaXQoKTtcclxufTtcclxuXHJcbi8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvalF1ZXJ5LnZhbGlkYXRvci5mb3JtYXQvXHJcbiQudmFsaWRhdG9yLmZvcm1hdCA9IGZ1bmN0aW9uKCBzb3VyY2UsIHBhcmFtcyApIHtcclxuXHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgKSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBhcmdzID0gJC5tYWtlQXJyYXkoIGFyZ3VtZW50cyApO1xyXG5cdFx0XHRhcmdzLnVuc2hpZnQoIHNvdXJjZSApO1xyXG5cdFx0XHRyZXR1cm4gJC52YWxpZGF0b3IuZm9ybWF0LmFwcGx5KCB0aGlzLCBhcmdzICk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHRpZiAoIHBhcmFtcyA9PT0gdW5kZWZpbmVkICkge1xyXG5cdFx0cmV0dXJuIHNvdXJjZTtcclxuXHR9XHJcblx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBwYXJhbXMuY29uc3RydWN0b3IgIT09IEFycmF5ICApIHtcclxuXHRcdHBhcmFtcyA9ICQubWFrZUFycmF5KCBhcmd1bWVudHMgKS5zbGljZSggMSApO1xyXG5cdH1cclxuXHRpZiAoIHBhcmFtcy5jb25zdHJ1Y3RvciAhPT0gQXJyYXkgKSB7XHJcblx0XHRwYXJhbXMgPSBbIHBhcmFtcyBdO1xyXG5cdH1cclxuXHQkLmVhY2goIHBhcmFtcywgZnVuY3Rpb24oIGksIG4gKSB7XHJcblx0XHRzb3VyY2UgPSBzb3VyY2UucmVwbGFjZSggbmV3IFJlZ0V4cCggXCJcXFxce1wiICsgaSArIFwiXFxcXH1cIiwgXCJnXCIgKSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBuO1xyXG5cdFx0fSApO1xyXG5cdH0gKTtcclxuXHRyZXR1cm4gc291cmNlO1xyXG59O1xyXG5cclxuJC5leHRlbmQoICQudmFsaWRhdG9yLCB7XHJcblxyXG5cdGRlZmF1bHRzOiB7XHJcblx0XHRtZXNzYWdlczoge30sXHJcblx0XHRncm91cHM6IHt9LFxyXG5cdFx0cnVsZXM6IHt9LFxyXG5cdFx0ZXJyb3JDbGFzczogXCJlcnJvclwiLFxyXG5cdFx0cGVuZGluZ0NsYXNzOiBcInBlbmRpbmdcIixcclxuXHRcdHZhbGlkQ2xhc3M6IFwidmFsaWRcIixcclxuXHRcdGVycm9yRWxlbWVudDogXCJsYWJlbFwiLFxyXG5cdFx0Zm9jdXNDbGVhbnVwOiBmYWxzZSxcclxuXHRcdGZvY3VzSW52YWxpZDogdHJ1ZSxcclxuXHRcdGVycm9yQ29udGFpbmVyOiAkKCBbXSApLFxyXG5cdFx0ZXJyb3JMYWJlbENvbnRhaW5lcjogJCggW10gKSxcclxuXHRcdG9uc3VibWl0OiB0cnVlLFxyXG5cdFx0aWdub3JlOiBcIjpoaWRkZW5cIixcclxuXHRcdGlnbm9yZVRpdGxlOiBmYWxzZSxcclxuXHRcdG9uZm9jdXNpbjogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XHJcblx0XHRcdHRoaXMubGFzdEFjdGl2ZSA9IGVsZW1lbnQ7XHJcblxyXG5cdFx0XHQvLyBIaWRlIGVycm9yIGxhYmVsIGFuZCByZW1vdmUgZXJyb3IgY2xhc3Mgb24gZm9jdXMgaWYgZW5hYmxlZFxyXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuZm9jdXNDbGVhbnVwICkge1xyXG5cdFx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodCApIHtcclxuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQuY2FsbCggdGhpcywgZWxlbWVudCwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5oaWRlVGhlc2UoIHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICkgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdG9uZm9jdXNvdXQ6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0XHRpZiAoICF0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICYmICggZWxlbWVudC5uYW1lIGluIHRoaXMuc3VibWl0dGVkIHx8ICF0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgKSApIHtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdG9ua2V5dXA6IGZ1bmN0aW9uKCBlbGVtZW50LCBldmVudCApIHtcclxuXHJcblx0XHRcdC8vIEF2b2lkIHJldmFsaWRhdGUgdGhlIGZpZWxkIHdoZW4gcHJlc3Npbmcgb25lIG9mIHRoZSBmb2xsb3dpbmcga2V5c1xyXG5cdFx0XHQvLyBTaGlmdCAgICAgICA9PiAxNlxyXG5cdFx0XHQvLyBDdHJsICAgICAgICA9PiAxN1xyXG5cdFx0XHQvLyBBbHQgICAgICAgICA9PiAxOFxyXG5cdFx0XHQvLyBDYXBzIGxvY2sgICA9PiAyMFxyXG5cdFx0XHQvLyBFbmQgICAgICAgICA9PiAzNVxyXG5cdFx0XHQvLyBIb21lICAgICAgICA9PiAzNlxyXG5cdFx0XHQvLyBMZWZ0IGFycm93ICA9PiAzN1xyXG5cdFx0XHQvLyBVcCBhcnJvdyAgICA9PiAzOFxyXG5cdFx0XHQvLyBSaWdodCBhcnJvdyA9PiAzOVxyXG5cdFx0XHQvLyBEb3duIGFycm93ICA9PiA0MFxyXG5cdFx0XHQvLyBJbnNlcnQgICAgICA9PiA0NVxyXG5cdFx0XHQvLyBOdW0gbG9jayAgICA9PiAxNDRcclxuXHRcdFx0Ly8gQWx0R3Iga2V5ICAgPT4gMjI1XHJcblx0XHRcdHZhciBleGNsdWRlZEtleXMgPSBbXHJcblx0XHRcdFx0MTYsIDE3LCAxOCwgMjAsIDM1LCAzNiwgMzcsXHJcblx0XHRcdFx0MzgsIDM5LCA0MCwgNDUsIDE0NCwgMjI1XHJcblx0XHRcdF07XHJcblxyXG5cdFx0XHRpZiAoIGV2ZW50LndoaWNoID09PSA5ICYmIHRoaXMuZWxlbWVudFZhbHVlKCBlbGVtZW50ICkgPT09IFwiXCIgfHwgJC5pbkFycmF5KCBldmVudC5rZXlDb2RlLCBleGNsdWRlZEtleXMgKSAhPT0gLTEgKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCBlbGVtZW50Lm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgfHwgZWxlbWVudC5uYW1lIGluIHRoaXMuaW52YWxpZCApIHtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdG9uY2xpY2s6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cclxuXHRcdFx0Ly8gQ2xpY2sgb24gc2VsZWN0cywgcmFkaW9idXR0b25zIGFuZCBjaGVja2JveGVzXHJcblx0XHRcdGlmICggZWxlbWVudC5uYW1lIGluIHRoaXMuc3VibWl0dGVkICkge1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudCggZWxlbWVudCApO1xyXG5cclxuXHRcdFx0Ly8gT3Igb3B0aW9uIGVsZW1lbnRzLCBjaGVjayBwYXJlbnQgc2VsZWN0IGluIHRoYXQgY2FzZVxyXG5cdFx0XHR9IGVsc2UgaWYgKCBlbGVtZW50LnBhcmVudE5vZGUubmFtZSBpbiB0aGlzLnN1Ym1pdHRlZCApIHtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQoIGVsZW1lbnQucGFyZW50Tm9kZSApO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0aGlnaGxpZ2h0OiBmdW5jdGlvbiggZWxlbWVudCwgZXJyb3JDbGFzcywgdmFsaWRDbGFzcyApIHtcclxuXHRcdFx0aWYgKCBlbGVtZW50LnR5cGUgPT09IFwicmFkaW9cIiApIHtcclxuXHRcdFx0XHR0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLmFkZENsYXNzKCBlcnJvckNsYXNzICkucmVtb3ZlQ2xhc3MoIHZhbGlkQ2xhc3MgKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQkKCBlbGVtZW50ICkuYWRkQ2xhc3MoIGVycm9yQ2xhc3MgKS5yZW1vdmVDbGFzcyggdmFsaWRDbGFzcyApO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0dW5oaWdobGlnaHQ6IGZ1bmN0aW9uKCBlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzICkge1xyXG5cdFx0XHRpZiAoIGVsZW1lbnQudHlwZSA9PT0gXCJyYWRpb1wiICkge1xyXG5cdFx0XHRcdHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkucmVtb3ZlQ2xhc3MoIGVycm9yQ2xhc3MgKS5hZGRDbGFzcyggdmFsaWRDbGFzcyApO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdCQoIGVsZW1lbnQgKS5yZW1vdmVDbGFzcyggZXJyb3JDbGFzcyApLmFkZENsYXNzKCB2YWxpZENsYXNzICk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2pRdWVyeS52YWxpZGF0b3Iuc2V0RGVmYXVsdHMvXHJcblx0c2V0RGVmYXVsdHM6IGZ1bmN0aW9uKCBzZXR0aW5ncyApIHtcclxuXHRcdCQuZXh0ZW5kKCAkLnZhbGlkYXRvci5kZWZhdWx0cywgc2V0dGluZ3MgKTtcclxuXHR9LFxyXG5cclxuXHRtZXNzYWdlczoge1xyXG5cdFx0cmVxdWlyZWQ6IFwiVGhpcyBmaWVsZCBpcyByZXF1aXJlZC5cIixcclxuXHRcdHJlbW90ZTogXCJQbGVhc2UgZml4IHRoaXMgZmllbGQuXCIsXHJcblx0XHRlbWFpbDogXCJQbGVhc2UgZW50ZXIgYSB2YWxpZCBlbWFpbCBhZGRyZXNzLlwiLFxyXG5cdFx0dXJsOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIFVSTC5cIixcclxuXHRcdGRhdGU6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZGF0ZS5cIixcclxuXHRcdGRhdGVJU086IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZGF0ZSAoSVNPKS5cIixcclxuXHRcdG51bWJlcjogXCJQbGVhc2UgZW50ZXIgYSB2YWxpZCBudW1iZXIuXCIsXHJcblx0XHRkaWdpdHM6IFwiUGxlYXNlIGVudGVyIG9ubHkgZGlnaXRzLlwiLFxyXG5cdFx0ZXF1YWxUbzogXCJQbGVhc2UgZW50ZXIgdGhlIHNhbWUgdmFsdWUgYWdhaW4uXCIsXHJcblx0XHRtYXhsZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgbm8gbW9yZSB0aGFuIHswfSBjaGFyYWN0ZXJzLlwiICksXHJcblx0XHRtaW5sZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYXQgbGVhc3QgezB9IGNoYXJhY3RlcnMuXCIgKSxcclxuXHRcdHJhbmdlbGVuZ3RoOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgYmV0d2VlbiB7MH0gYW5kIHsxfSBjaGFyYWN0ZXJzIGxvbmcuXCIgKSxcclxuXHRcdHJhbmdlOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgYmV0d2VlbiB7MH0gYW5kIHsxfS5cIiApLFxyXG5cdFx0bWF4OiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHswfS5cIiApLFxyXG5cdFx0bWluOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHswfS5cIiApLFxyXG5cdFx0c3RlcDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhIG11bHRpcGxlIG9mIHswfS5cIiApXHJcblx0fSxcclxuXHJcblx0YXV0b0NyZWF0ZVJhbmdlczogZmFsc2UsXHJcblxyXG5cdHByb3RvdHlwZToge1xyXG5cclxuXHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGlzLmxhYmVsQ29udGFpbmVyID0gJCggdGhpcy5zZXR0aW5ncy5lcnJvckxhYmVsQ29udGFpbmVyICk7XHJcblx0XHRcdHRoaXMuZXJyb3JDb250ZXh0ID0gdGhpcy5sYWJlbENvbnRhaW5lci5sZW5ndGggJiYgdGhpcy5sYWJlbENvbnRhaW5lciB8fCAkKCB0aGlzLmN1cnJlbnRGb3JtICk7XHJcblx0XHRcdHRoaXMuY29udGFpbmVycyA9ICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JDb250YWluZXIgKS5hZGQoIHRoaXMuc2V0dGluZ3MuZXJyb3JMYWJlbENvbnRhaW5lciApO1xyXG5cdFx0XHR0aGlzLnN1Ym1pdHRlZCA9IHt9O1xyXG5cdFx0XHR0aGlzLnZhbHVlQ2FjaGUgPSB7fTtcclxuXHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdCA9IDA7XHJcblx0XHRcdHRoaXMucGVuZGluZyA9IHt9O1xyXG5cdFx0XHR0aGlzLmludmFsaWQgPSB7fTtcclxuXHRcdFx0dGhpcy5yZXNldCgpO1xyXG5cclxuXHRcdFx0dmFyIGN1cnJlbnRGb3JtID0gdGhpcy5jdXJyZW50Rm9ybSxcclxuXHRcdFx0XHRncm91cHMgPSAoIHRoaXMuZ3JvdXBzID0ge30gKSxcclxuXHRcdFx0XHRydWxlcztcclxuXHRcdFx0JC5lYWNoKCB0aGlzLnNldHRpbmdzLmdyb3VwcywgZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XHJcblx0XHRcdFx0aWYgKCB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlLnNwbGl0KCAvXFxzLyApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQkLmVhY2goIHZhbHVlLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XHJcblx0XHRcdFx0XHRncm91cHNbIG5hbWUgXSA9IGtleTtcclxuXHRcdFx0XHR9ICk7XHJcblx0XHRcdH0gKTtcclxuXHRcdFx0cnVsZXMgPSB0aGlzLnNldHRpbmdzLnJ1bGVzO1xyXG5cdFx0XHQkLmVhY2goIHJ1bGVzLCBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcclxuXHRcdFx0XHRydWxlc1sga2V5IF0gPSAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCB2YWx1ZSApO1xyXG5cdFx0XHR9ICk7XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkZWxlZ2F0ZSggZXZlbnQgKSB7XHJcblx0XHRcdFx0dmFyIGlzQ29udGVudEVkaXRhYmxlID0gdHlwZW9mICQoIHRoaXMgKS5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwidW5kZWZpbmVkXCIgJiYgJCggdGhpcyApLmF0dHIoIFwiY29udGVudGVkaXRhYmxlXCIgKSAhPT0gXCJmYWxzZVwiO1xyXG5cclxuXHRcdFx0XHQvLyBTZXQgZm9ybSBleHBhbmRvIG9uIGNvbnRlbnRlZGl0YWJsZVxyXG5cdFx0XHRcdGlmICggIXRoaXMuZm9ybSAmJiBpc0NvbnRlbnRFZGl0YWJsZSApIHtcclxuXHRcdFx0XHRcdHRoaXMuZm9ybSA9ICQoIHRoaXMgKS5jbG9zZXN0KCBcImZvcm1cIiApWyAwIF07XHJcblx0XHRcdFx0XHR0aGlzLm5hbWUgPSAkKCB0aGlzICkuYXR0ciggXCJuYW1lXCIgKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vIElnbm9yZSB0aGUgZWxlbWVudCBpZiBpdCBiZWxvbmdzIHRvIGFub3RoZXIgZm9ybS4gVGhpcyB3aWxsIGhhcHBlbiBtYWlubHlcclxuXHRcdFx0XHQvLyB3aGVuIHNldHRpbmcgdGhlIGBmb3JtYCBhdHRyaWJ1dGUgb2YgYW4gaW5wdXQgdG8gdGhlIGlkIG9mIGFub3RoZXIgZm9ybS5cclxuXHRcdFx0XHRpZiAoIGN1cnJlbnRGb3JtICE9PSB0aGlzLmZvcm0gKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR2YXIgdmFsaWRhdG9yID0gJC5kYXRhKCB0aGlzLmZvcm0sIFwidmFsaWRhdG9yXCIgKSxcclxuXHRcdFx0XHRcdGV2ZW50VHlwZSA9IFwib25cIiArIGV2ZW50LnR5cGUucmVwbGFjZSggL152YWxpZGF0ZS8sIFwiXCIgKSxcclxuXHRcdFx0XHRcdHNldHRpbmdzID0gdmFsaWRhdG9yLnNldHRpbmdzO1xyXG5cdFx0XHRcdGlmICggc2V0dGluZ3NbIGV2ZW50VHlwZSBdICYmICEkKCB0aGlzICkuaXMoIHNldHRpbmdzLmlnbm9yZSApICkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3NbIGV2ZW50VHlwZSBdLmNhbGwoIHZhbGlkYXRvciwgdGhpcywgZXZlbnQgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKVxyXG5cdFx0XHRcdC5vbiggXCJmb2N1c2luLnZhbGlkYXRlIGZvY3Vzb3V0LnZhbGlkYXRlIGtleXVwLnZhbGlkYXRlXCIsXHJcblx0XHRcdFx0XHRcIjp0ZXh0LCBbdHlwZT0ncGFzc3dvcmQnXSwgW3R5cGU9J2ZpbGUnXSwgc2VsZWN0LCB0ZXh0YXJlYSwgW3R5cGU9J251bWJlciddLCBbdHlwZT0nc2VhcmNoJ10sIFwiICtcclxuXHRcdFx0XHRcdFwiW3R5cGU9J3RlbCddLCBbdHlwZT0ndXJsJ10sIFt0eXBlPSdlbWFpbCddLCBbdHlwZT0nZGF0ZXRpbWUnXSwgW3R5cGU9J2RhdGUnXSwgW3R5cGU9J21vbnRoJ10sIFwiICtcclxuXHRcdFx0XHRcdFwiW3R5cGU9J3dlZWsnXSwgW3R5cGU9J3RpbWUnXSwgW3R5cGU9J2RhdGV0aW1lLWxvY2FsJ10sIFt0eXBlPSdyYW5nZSddLCBbdHlwZT0nY29sb3InXSwgXCIgK1xyXG5cdFx0XHRcdFx0XCJbdHlwZT0ncmFkaW8nXSwgW3R5cGU9J2NoZWNrYm94J10sIFtjb250ZW50ZWRpdGFibGVdLCBbdHlwZT0nYnV0dG9uJ11cIiwgZGVsZWdhdGUgKVxyXG5cclxuXHRcdFx0XHQvLyBTdXBwb3J0OiBDaHJvbWUsIG9sZElFXHJcblx0XHRcdFx0Ly8gXCJzZWxlY3RcIiBpcyBwcm92aWRlZCBhcyBldmVudC50YXJnZXQgd2hlbiBjbGlja2luZyBhIG9wdGlvblxyXG5cdFx0XHRcdC5vbiggXCJjbGljay52YWxpZGF0ZVwiLCBcInNlbGVjdCwgb3B0aW9uLCBbdHlwZT0ncmFkaW8nXSwgW3R5cGU9J2NoZWNrYm94J11cIiwgZGVsZWdhdGUgKTtcclxuXHJcblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5pbnZhbGlkSGFuZGxlciApIHtcclxuXHRcdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtICkub24oIFwiaW52YWxpZC1mb3JtLnZhbGlkYXRlXCIsIHRoaXMuc2V0dGluZ3MuaW52YWxpZEhhbmRsZXIgKTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5mb3JtL1xyXG5cdFx0Zm9ybTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHRoaXMuY2hlY2tGb3JtKCk7XHJcblx0XHRcdCQuZXh0ZW5kKCB0aGlzLnN1Ym1pdHRlZCwgdGhpcy5lcnJvck1hcCApO1xyXG5cdFx0XHR0aGlzLmludmFsaWQgPSAkLmV4dGVuZCgge30sIHRoaXMuZXJyb3JNYXAgKTtcclxuXHRcdFx0aWYgKCAhdGhpcy52YWxpZCgpICkge1xyXG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS50cmlnZ2VySGFuZGxlciggXCJpbnZhbGlkLWZvcm1cIiwgWyB0aGlzIF0gKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnNob3dFcnJvcnMoKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudmFsaWQoKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Y2hlY2tGb3JtOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dGhpcy5wcmVwYXJlRm9ybSgpO1xyXG5cdFx0XHRmb3IgKCB2YXIgaSA9IDAsIGVsZW1lbnRzID0gKCB0aGlzLmN1cnJlbnRFbGVtZW50cyA9IHRoaXMuZWxlbWVudHMoKSApOyBlbGVtZW50c1sgaSBdOyBpKysgKSB7XHJcblx0XHRcdFx0dGhpcy5jaGVjayggZWxlbWVudHNbIGkgXSApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzLnZhbGlkKCk7XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvVmFsaWRhdG9yLmVsZW1lbnQvXHJcblx0XHRlbGVtZW50OiBmdW5jdGlvbiggZWxlbWVudCApIHtcclxuXHRcdFx0dmFyIGNsZWFuRWxlbWVudCA9IHRoaXMuY2xlYW4oIGVsZW1lbnQgKSxcclxuXHRcdFx0XHRjaGVja0VsZW1lbnQgPSB0aGlzLnZhbGlkYXRpb25UYXJnZXRGb3IoIGNsZWFuRWxlbWVudCApLFxyXG5cdFx0XHRcdHYgPSB0aGlzLFxyXG5cdFx0XHRcdHJlc3VsdCA9IHRydWUsXHJcblx0XHRcdFx0cnMsIGdyb3VwO1xyXG5cclxuXHRcdFx0aWYgKCBjaGVja0VsZW1lbnQgPT09IHVuZGVmaW5lZCApIHtcclxuXHRcdFx0XHRkZWxldGUgdGhpcy5pbnZhbGlkWyBjbGVhbkVsZW1lbnQubmFtZSBdO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJlcGFyZUVsZW1lbnQoIGNoZWNrRWxlbWVudCApO1xyXG5cdFx0XHRcdHRoaXMuY3VycmVudEVsZW1lbnRzID0gJCggY2hlY2tFbGVtZW50ICk7XHJcblxyXG5cdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBpcyBncm91cGVkLCB0aGVuIHZhbGlkYXRlIGFsbCBncm91cCBlbGVtZW50cyBhbHJlYWR5XHJcblx0XHRcdFx0Ly8gY29udGFpbmluZyBhIHZhbHVlXHJcblx0XHRcdFx0Z3JvdXAgPSB0aGlzLmdyb3Vwc1sgY2hlY2tFbGVtZW50Lm5hbWUgXTtcclxuXHRcdFx0XHRpZiAoIGdyb3VwICkge1xyXG5cdFx0XHRcdFx0JC5lYWNoKCB0aGlzLmdyb3VwcywgZnVuY3Rpb24oIG5hbWUsIHRlc3Rncm91cCApIHtcclxuXHRcdFx0XHRcdFx0aWYgKCB0ZXN0Z3JvdXAgPT09IGdyb3VwICYmIG5hbWUgIT09IGNoZWNrRWxlbWVudC5uYW1lICkge1xyXG5cdFx0XHRcdFx0XHRcdGNsZWFuRWxlbWVudCA9IHYudmFsaWRhdGlvblRhcmdldEZvciggdi5jbGVhbiggdi5maW5kQnlOYW1lKCBuYW1lICkgKSApO1xyXG5cdFx0XHRcdFx0XHRcdGlmICggY2xlYW5FbGVtZW50ICYmIGNsZWFuRWxlbWVudC5uYW1lIGluIHYuaW52YWxpZCApIHtcclxuXHRcdFx0XHRcdFx0XHRcdHYuY3VycmVudEVsZW1lbnRzLnB1c2goIGNsZWFuRWxlbWVudCApO1xyXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gdi5jaGVjayggY2xlYW5FbGVtZW50ICkgJiYgcmVzdWx0O1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSApO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cnMgPSB0aGlzLmNoZWNrKCBjaGVja0VsZW1lbnQgKSAhPT0gZmFsc2U7XHJcblx0XHRcdFx0cmVzdWx0ID0gcmVzdWx0ICYmIHJzO1xyXG5cdFx0XHRcdGlmICggcnMgKSB7XHJcblx0XHRcdFx0XHR0aGlzLmludmFsaWRbIGNoZWNrRWxlbWVudC5uYW1lIF0gPSBmYWxzZTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5pbnZhbGlkWyBjaGVja0VsZW1lbnQubmFtZSBdID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmICggIXRoaXMubnVtYmVyT2ZJbnZhbGlkcygpICkge1xyXG5cclxuXHRcdFx0XHRcdC8vIEhpZGUgZXJyb3IgY29udGFpbmVycyBvbiBsYXN0IGVycm9yXHJcblx0XHRcdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLmFkZCggdGhpcy5jb250YWluZXJzICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2hvd0Vycm9ycygpO1xyXG5cclxuXHRcdFx0XHQvLyBBZGQgYXJpYS1pbnZhbGlkIHN0YXR1cyBmb3Igc2NyZWVuIHJlYWRlcnNcclxuXHRcdFx0XHQkKCBlbGVtZW50ICkuYXR0ciggXCJhcmlhLWludmFsaWRcIiwgIXJzICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiByZXN1bHQ7XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvVmFsaWRhdG9yLnNob3dFcnJvcnMvXHJcblx0XHRzaG93RXJyb3JzOiBmdW5jdGlvbiggZXJyb3JzICkge1xyXG5cdFx0XHRpZiAoIGVycm9ycyApIHtcclxuXHRcdFx0XHR2YXIgdmFsaWRhdG9yID0gdGhpcztcclxuXHJcblx0XHRcdFx0Ly8gQWRkIGl0ZW1zIHRvIGVycm9yIGxpc3QgYW5kIG1hcFxyXG5cdFx0XHRcdCQuZXh0ZW5kKCB0aGlzLmVycm9yTWFwLCBlcnJvcnMgKTtcclxuXHRcdFx0XHR0aGlzLmVycm9yTGlzdCA9ICQubWFwKCB0aGlzLmVycm9yTWFwLCBmdW5jdGlvbiggbWVzc2FnZSwgbmFtZSApIHtcclxuXHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXHJcblx0XHRcdFx0XHRcdGVsZW1lbnQ6IHZhbGlkYXRvci5maW5kQnlOYW1lKCBuYW1lIClbIDAgXVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9ICk7XHJcblxyXG5cdFx0XHRcdC8vIFJlbW92ZSBpdGVtcyBmcm9tIHN1Y2Nlc3MgbGlzdFxyXG5cdFx0XHRcdHRoaXMuc3VjY2Vzc0xpc3QgPSAkLmdyZXAoIHRoaXMuc3VjY2Vzc0xpc3QsIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuICEoIGVsZW1lbnQubmFtZSBpbiBlcnJvcnMgKTtcclxuXHRcdFx0XHR9ICk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLnNob3dFcnJvcnMgKSB7XHJcblx0XHRcdFx0dGhpcy5zZXR0aW5ncy5zaG93RXJyb3JzLmNhbGwoIHRoaXMsIHRoaXMuZXJyb3JNYXAsIHRoaXMuZXJyb3JMaXN0ICk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5kZWZhdWx0U2hvd0Vycm9ycygpO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvVmFsaWRhdG9yLnJlc2V0Rm9ybS9cclxuXHRcdHJlc2V0Rm9ybTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmICggJC5mbi5yZXNldEZvcm0gKSB7XHJcblx0XHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApLnJlc2V0Rm9ybSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuaW52YWxpZCA9IHt9O1xyXG5cdFx0XHR0aGlzLnN1Ym1pdHRlZCA9IHt9O1xyXG5cdFx0XHR0aGlzLnByZXBhcmVGb3JtKCk7XHJcblx0XHRcdHRoaXMuaGlkZUVycm9ycygpO1xyXG5cdFx0XHR2YXIgZWxlbWVudHMgPSB0aGlzLmVsZW1lbnRzKClcclxuXHRcdFx0XHQucmVtb3ZlRGF0YSggXCJwcmV2aW91c1ZhbHVlXCIgKVxyXG5cdFx0XHRcdC5yZW1vdmVBdHRyKCBcImFyaWEtaW52YWxpZFwiICk7XHJcblxyXG5cdFx0XHR0aGlzLnJlc2V0RWxlbWVudHMoIGVsZW1lbnRzICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdHJlc2V0RWxlbWVudHM6IGZ1bmN0aW9uKCBlbGVtZW50cyApIHtcclxuXHRcdFx0dmFyIGk7XHJcblxyXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQgKSB7XHJcblx0XHRcdFx0Zm9yICggaSA9IDA7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcclxuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQuY2FsbCggdGhpcywgZWxlbWVudHNbIGkgXSxcclxuXHRcdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCBcIlwiICk7XHJcblx0XHRcdFx0XHR0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnRzWyBpIF0ubmFtZSApLnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0ZWxlbWVudHNcclxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzIClcclxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICk7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblxyXG5cdFx0bnVtYmVyT2ZJbnZhbGlkczogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLm9iamVjdExlbmd0aCggdGhpcy5pbnZhbGlkICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdG9iamVjdExlbmd0aDogZnVuY3Rpb24oIG9iaiApIHtcclxuXHRcdFx0LyoganNoaW50IHVudXNlZDogZmFsc2UgKi9cclxuXHRcdFx0dmFyIGNvdW50ID0gMCxcclxuXHRcdFx0XHRpO1xyXG5cdFx0XHRmb3IgKCBpIGluIG9iaiApIHtcclxuXHJcblx0XHRcdFx0Ly8gVGhpcyBjaGVjayBhbGxvd3MgY291bnRpbmcgZWxlbWVudHMgd2l0aCBlbXB0eSBlcnJvclxyXG5cdFx0XHRcdC8vIG1lc3NhZ2UgYXMgaW52YWxpZCBlbGVtZW50c1xyXG5cdFx0XHRcdGlmICggb2JqWyBpIF0gIT09IHVuZGVmaW5lZCAmJiBvYmpbIGkgXSAhPT0gbnVsbCAmJiBvYmpbIGkgXSAhPT0gZmFsc2UgKSB7XHJcblx0XHRcdFx0XHRjb3VudCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gY291bnQ7XHJcblx0XHR9LFxyXG5cclxuXHRcdGhpZGVFcnJvcnM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGlzLmhpZGVUaGVzZSggdGhpcy50b0hpZGUgKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0aGlkZVRoZXNlOiBmdW5jdGlvbiggZXJyb3JzICkge1xyXG5cdFx0XHRlcnJvcnMubm90KCB0aGlzLmNvbnRhaW5lcnMgKS50ZXh0KCBcIlwiICk7XHJcblx0XHRcdHRoaXMuYWRkV3JhcHBlciggZXJyb3JzICkuaGlkZSgpO1xyXG5cdFx0fSxcclxuXHJcblx0XHR2YWxpZDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnNpemUoKSA9PT0gMDtcclxuXHRcdH0sXHJcblxyXG5cdFx0c2l6ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmVycm9yTGlzdC5sZW5ndGg7XHJcblx0XHR9LFxyXG5cclxuXHRcdGZvY3VzSW52YWxpZDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5mb2N1c0ludmFsaWQgKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdCQoIHRoaXMuZmluZExhc3RBY3RpdmUoKSB8fCB0aGlzLmVycm9yTGlzdC5sZW5ndGggJiYgdGhpcy5lcnJvckxpc3RbIDAgXS5lbGVtZW50IHx8IFtdIClcclxuXHRcdFx0XHRcdC5maWx0ZXIoIFwiOnZpc2libGVcIiApXHJcblx0XHRcdFx0XHQudHJpZ2dlciggXCJmb2N1c1wiIClcclxuXHJcblx0XHRcdFx0XHQvLyBNYW51YWxseSB0cmlnZ2VyIGZvY3VzaW4gZXZlbnQ7IHdpdGhvdXQgaXQsIGZvY3VzaW4gaGFuZGxlciBpc24ndCBjYWxsZWQsIGZpbmRMYXN0QWN0aXZlIHdvbid0IGhhdmUgYW55dGhpbmcgdG8gZmluZFxyXG5cdFx0XHRcdFx0LnRyaWdnZXIoIFwiZm9jdXNpblwiICk7XHJcblx0XHRcdFx0fSBjYXRjaCAoIGUgKSB7XHJcblxyXG5cdFx0XHRcdFx0Ly8gSWdub3JlIElFIHRocm93aW5nIGVycm9ycyB3aGVuIGZvY3VzaW5nIGhpZGRlbiBlbGVtZW50c1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHJcblx0XHRmaW5kTGFzdEFjdGl2ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBsYXN0QWN0aXZlID0gdGhpcy5sYXN0QWN0aXZlO1xyXG5cdFx0XHRyZXR1cm4gbGFzdEFjdGl2ZSAmJiAkLmdyZXAoIHRoaXMuZXJyb3JMaXN0LCBmdW5jdGlvbiggbiApIHtcclxuXHRcdFx0XHRyZXR1cm4gbi5lbGVtZW50Lm5hbWUgPT09IGxhc3RBY3RpdmUubmFtZTtcclxuXHRcdFx0fSApLmxlbmd0aCA9PT0gMSAmJiBsYXN0QWN0aXZlO1xyXG5cdFx0fSxcclxuXHJcblx0XHRlbGVtZW50czogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciB2YWxpZGF0b3IgPSB0aGlzLFxyXG5cdFx0XHRcdHJ1bGVzQ2FjaGUgPSB7fTtcclxuXHJcblx0XHRcdC8vIFNlbGVjdCBhbGwgdmFsaWQgaW5wdXRzIGluc2lkZSB0aGUgZm9ybSAobm8gc3VibWl0IG9yIHJlc2V0IGJ1dHRvbnMpXHJcblx0XHRcdHJldHVybiAkKCB0aGlzLmN1cnJlbnRGb3JtIClcclxuXHRcdFx0LmZpbmQoIFwiaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWEsIFtjb250ZW50ZWRpdGFibGVdXCIgKVxyXG5cdFx0XHQubm90KCBcIjpzdWJtaXQsIDpyZXNldCwgOmltYWdlLCA6ZGlzYWJsZWRcIiApXHJcblx0XHRcdC5ub3QoIHRoaXMuc2V0dGluZ3MuaWdub3JlIClcclxuXHRcdFx0LmZpbHRlciggZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIG5hbWUgPSB0aGlzLm5hbWUgfHwgJCggdGhpcyApLmF0dHIoIFwibmFtZVwiICk7IC8vIEZvciBjb250ZW50ZWRpdGFibGVcclxuXHRcdFx0XHR2YXIgaXNDb250ZW50RWRpdGFibGUgPSB0eXBlb2YgJCggdGhpcyApLmF0dHIoIFwiY29udGVudGVkaXRhYmxlXCIgKSAhPT0gXCJ1bmRlZmluZWRcIiAmJiAkKCB0aGlzICkuYXR0ciggXCJjb250ZW50ZWRpdGFibGVcIiApICE9PSBcImZhbHNlXCI7XHJcblxyXG5cdFx0XHRcdGlmICggIW5hbWUgJiYgdmFsaWRhdG9yLnNldHRpbmdzLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvciggXCIlbyBoYXMgbm8gbmFtZSBhc3NpZ25lZFwiLCB0aGlzICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBTZXQgZm9ybSBleHBhbmRvIG9uIGNvbnRlbnRlZGl0YWJsZVxyXG5cdFx0XHRcdGlmICggaXNDb250ZW50RWRpdGFibGUgKSB7XHJcblx0XHRcdFx0XHR0aGlzLmZvcm0gPSAkKCB0aGlzICkuY2xvc2VzdCggXCJmb3JtXCIgKVsgMCBdO1xyXG5cdFx0XHRcdFx0dGhpcy5uYW1lID0gbmFtZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vIElnbm9yZSBlbGVtZW50cyB0aGF0IGJlbG9uZyB0byBvdGhlci9uZXN0ZWQgZm9ybXNcclxuXHRcdFx0XHRpZiAoIHRoaXMuZm9ybSAhPT0gdmFsaWRhdG9yLmN1cnJlbnRGb3JtICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gU2VsZWN0IG9ubHkgdGhlIGZpcnN0IGVsZW1lbnQgZm9yIGVhY2ggbmFtZSwgYW5kIG9ubHkgdGhvc2Ugd2l0aCBydWxlcyBzcGVjaWZpZWRcclxuXHRcdFx0XHRpZiAoIG5hbWUgaW4gcnVsZXNDYWNoZSB8fCAhdmFsaWRhdG9yLm9iamVjdExlbmd0aCggJCggdGhpcyApLnJ1bGVzKCkgKSApIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJ1bGVzQ2FjaGVbIG5hbWUgXSA9IHRydWU7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Y2xlYW46IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcclxuXHRcdFx0cmV0dXJuICQoIHNlbGVjdG9yIClbIDAgXTtcclxuXHRcdH0sXHJcblxyXG5cdFx0ZXJyb3JzOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGVycm9yQ2xhc3MgPSB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3Muc3BsaXQoIFwiIFwiICkuam9pbiggXCIuXCIgKTtcclxuXHRcdFx0cmV0dXJuICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JFbGVtZW50ICsgXCIuXCIgKyBlcnJvckNsYXNzLCB0aGlzLmVycm9yQ29udGV4dCApO1xyXG5cdFx0fSxcclxuXHJcblx0XHRyZXNldEludGVybmFsczogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHRoaXMuc3VjY2Vzc0xpc3QgPSBbXTtcclxuXHRcdFx0dGhpcy5lcnJvckxpc3QgPSBbXTtcclxuXHRcdFx0dGhpcy5lcnJvck1hcCA9IHt9O1xyXG5cdFx0XHR0aGlzLnRvU2hvdyA9ICQoIFtdICk7XHJcblx0XHRcdHRoaXMudG9IaWRlID0gJCggW10gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0cmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGlzLnJlc2V0SW50ZXJuYWxzKCk7XHJcblx0XHRcdHRoaXMuY3VycmVudEVsZW1lbnRzID0gJCggW10gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0cHJlcGFyZUZvcm06IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGlzLnJlc2V0KCk7XHJcblx0XHRcdHRoaXMudG9IaWRlID0gdGhpcy5lcnJvcnMoKS5hZGQoIHRoaXMuY29udGFpbmVycyApO1xyXG5cdFx0fSxcclxuXHJcblx0XHRwcmVwYXJlRWxlbWVudDogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XHJcblx0XHRcdHRoaXMucmVzZXQoKTtcclxuXHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLmVycm9yc0ZvciggZWxlbWVudCApO1xyXG5cdFx0fSxcclxuXHJcblx0XHRlbGVtZW50VmFsdWU6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0XHR2YXIgJGVsZW1lbnQgPSAkKCBlbGVtZW50ICksXHJcblx0XHRcdFx0dHlwZSA9IGVsZW1lbnQudHlwZSxcclxuXHRcdFx0XHRpc0NvbnRlbnRFZGl0YWJsZSA9IHR5cGVvZiAkZWxlbWVudC5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwidW5kZWZpbmVkXCIgJiYgJGVsZW1lbnQuYXR0ciggXCJjb250ZW50ZWRpdGFibGVcIiApICE9PSBcImZhbHNlXCIsXHJcblx0XHRcdFx0dmFsLCBpZHg7XHJcblxyXG5cdFx0XHRpZiAoIHR5cGUgPT09IFwicmFkaW9cIiB8fCB0eXBlID09PSBcImNoZWNrYm94XCIgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkuZmlsdGVyKCBcIjpjaGVja2VkXCIgKS52YWwoKTtcclxuXHRcdFx0fSBlbHNlIGlmICggdHlwZSA9PT0gXCJudW1iZXJcIiAmJiB0eXBlb2YgZWxlbWVudC52YWxpZGl0eSAhPT0gXCJ1bmRlZmluZWRcIiApIHtcclxuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC52YWxpZGl0eS5iYWRJbnB1dCA/IFwiTmFOXCIgOiAkZWxlbWVudC52YWwoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKCBpc0NvbnRlbnRFZGl0YWJsZSApIHtcclxuXHRcdFx0XHR2YWwgPSAkZWxlbWVudC50ZXh0KCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dmFsID0gJGVsZW1lbnQudmFsKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICggdHlwZSA9PT0gXCJmaWxlXCIgKSB7XHJcblxyXG5cdFx0XHRcdC8vIE1vZGVybiBicm93c2VyIChjaHJvbWUgJiBzYWZhcmkpXHJcblx0XHRcdFx0aWYgKCB2YWwuc3Vic3RyKCAwLCAxMiApID09PSBcIkM6XFxcXGZha2VwYXRoXFxcXFwiICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHZhbC5zdWJzdHIoIDEyICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBMZWdhY3kgYnJvd3NlcnNcclxuXHRcdFx0XHQvLyBVbml4LWJhc2VkIHBhdGhcclxuXHRcdFx0XHRpZHggPSB2YWwubGFzdEluZGV4T2YoIFwiL1wiICk7XHJcblx0XHRcdFx0aWYgKCBpZHggPj0gMCApIHtcclxuXHRcdFx0XHRcdHJldHVybiB2YWwuc3Vic3RyKCBpZHggKyAxICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBXaW5kb3dzLWJhc2VkIHBhdGhcclxuXHRcdFx0XHRpZHggPSB2YWwubGFzdEluZGV4T2YoIFwiXFxcXFwiICk7XHJcblx0XHRcdFx0aWYgKCBpZHggPj0gMCApIHtcclxuXHRcdFx0XHRcdHJldHVybiB2YWwuc3Vic3RyKCBpZHggKyAxICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBKdXN0IHRoZSBmaWxlIG5hbWVcclxuXHRcdFx0XHRyZXR1cm4gdmFsO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHZhbC5yZXBsYWNlKCAvXFxyL2csIFwiXCIgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdmFsO1xyXG5cdFx0fSxcclxuXHJcblx0XHRjaGVjazogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XHJcblx0XHRcdGVsZW1lbnQgPSB0aGlzLnZhbGlkYXRpb25UYXJnZXRGb3IoIHRoaXMuY2xlYW4oIGVsZW1lbnQgKSApO1xyXG5cclxuXHRcdFx0dmFyIHJ1bGVzID0gJCggZWxlbWVudCApLnJ1bGVzKCksXHJcblx0XHRcdFx0cnVsZXNDb3VudCA9ICQubWFwKCBydWxlcywgZnVuY3Rpb24oIG4sIGkgKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gaTtcclxuXHRcdFx0XHR9ICkubGVuZ3RoLFxyXG5cdFx0XHRcdGRlcGVuZGVuY3lNaXNtYXRjaCA9IGZhbHNlLFxyXG5cdFx0XHRcdHZhbCA9IHRoaXMuZWxlbWVudFZhbHVlKCBlbGVtZW50ICksXHJcblx0XHRcdFx0cmVzdWx0LCBtZXRob2QsIHJ1bGUsIG5vcm1hbGl6ZXI7XHJcblxyXG5cdFx0XHQvLyBQcmlvcml0aXplIHRoZSBsb2NhbCBub3JtYWxpemVyIGRlZmluZWQgZm9yIHRoaXMgZWxlbWVudCBvdmVyIHRoZSBnbG9iYWwgb25lXHJcblx0XHRcdC8vIGlmIHRoZSBmb3JtZXIgZXhpc3RzLCBvdGhlcndpc2UgdXNlciB0aGUgZ2xvYmFsIG9uZSBpbiBjYXNlIGl0IGV4aXN0cy5cclxuXHRcdFx0aWYgKCB0eXBlb2YgcnVsZXMubm9ybWFsaXplciA9PT0gXCJmdW5jdGlvblwiICkge1xyXG5cdFx0XHRcdG5vcm1hbGl6ZXIgPSBydWxlcy5ub3JtYWxpemVyO1xyXG5cdFx0XHR9IGVsc2UgaWYgKFx0dHlwZW9mIHRoaXMuc2V0dGluZ3Mubm9ybWFsaXplciA9PT0gXCJmdW5jdGlvblwiICkge1xyXG5cdFx0XHRcdG5vcm1hbGl6ZXIgPSB0aGlzLnNldHRpbmdzLm5vcm1hbGl6ZXI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIElmIG5vcm1hbGl6ZXIgaXMgZGVmaW5lZCwgdGhlbiBjYWxsIGl0IHRvIHJldHJlaXZlIHRoZSBjaGFuZ2VkIHZhbHVlIGluc3RlYWRcclxuXHRcdFx0Ly8gb2YgdXNpbmcgdGhlIHJlYWwgb25lLlxyXG5cdFx0XHQvLyBOb3RlIHRoYXQgYHRoaXNgIGluIHRoZSBub3JtYWxpemVyIGlzIGBlbGVtZW50YC5cclxuXHRcdFx0aWYgKCBub3JtYWxpemVyICkge1xyXG5cdFx0XHRcdHZhbCA9IG5vcm1hbGl6ZXIuY2FsbCggZWxlbWVudCwgdmFsICk7XHJcblxyXG5cdFx0XHRcdC8vIERlbGV0ZSB0aGUgbm9ybWFsaXplciBmcm9tIHJ1bGVzIHRvIGF2b2lkIHRyZWF0aW5nIGl0IGFzIGEgcHJlLWRlZmluZWQgbWV0aG9kLlxyXG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5ub3JtYWxpemVyO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKCBtZXRob2QgaW4gcnVsZXMgKSB7XHJcblx0XHRcdFx0cnVsZSA9IHsgbWV0aG9kOiBtZXRob2QsIHBhcmFtZXRlcnM6IHJ1bGVzWyBtZXRob2QgXSB9O1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRyZXN1bHQgPSAkLnZhbGlkYXRvci5tZXRob2RzWyBtZXRob2QgXS5jYWxsKCB0aGlzLCB2YWwsIGVsZW1lbnQsIHJ1bGUucGFyYW1ldGVycyApO1xyXG5cclxuXHRcdFx0XHRcdC8vIElmIGEgbWV0aG9kIGluZGljYXRlcyB0aGF0IHRoZSBmaWVsZCBpcyBvcHRpb25hbCBhbmQgdGhlcmVmb3JlIHZhbGlkLFxyXG5cdFx0XHRcdFx0Ly8gZG9uJ3QgbWFyayBpdCBhcyB2YWxpZCB3aGVuIHRoZXJlIGFyZSBubyBvdGhlciBydWxlc1xyXG5cdFx0XHRcdFx0aWYgKCByZXN1bHQgPT09IFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiICYmIHJ1bGVzQ291bnQgPT09IDEgKSB7XHJcblx0XHRcdFx0XHRcdGRlcGVuZGVuY3lNaXNtYXRjaCA9IHRydWU7XHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZGVwZW5kZW5jeU1pc21hdGNoID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdFx0aWYgKCByZXN1bHQgPT09IFwicGVuZGluZ1wiICkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLm5vdCggdGhpcy5lcnJvcnNGb3IoIGVsZW1lbnQgKSApO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKCAhcmVzdWx0ICkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmZvcm1hdEFuZEFkZCggZWxlbWVudCwgcnVsZSApO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBjYXRjaCAoIGUgKSB7XHJcblx0XHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCBcIkV4Y2VwdGlvbiBvY2N1cnJlZCB3aGVuIGNoZWNraW5nIGVsZW1lbnQgXCIgKyBlbGVtZW50LmlkICsgXCIsIGNoZWNrIHRoZSAnXCIgKyBydWxlLm1ldGhvZCArIFwiJyBtZXRob2QuXCIsIGUgKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmICggZSBpbnN0YW5jZW9mIFR5cGVFcnJvciApIHtcclxuXHRcdFx0XHRcdFx0ZS5tZXNzYWdlICs9IFwiLiAgRXhjZXB0aW9uIG9jY3VycmVkIHdoZW4gY2hlY2tpbmcgZWxlbWVudCBcIiArIGVsZW1lbnQuaWQgKyBcIiwgY2hlY2sgdGhlICdcIiArIHJ1bGUubWV0aG9kICsgXCInIG1ldGhvZC5cIjtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR0aHJvdyBlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIGRlcGVuZGVuY3lNaXNtYXRjaCApIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCB0aGlzLm9iamVjdExlbmd0aCggcnVsZXMgKSApIHtcclxuXHRcdFx0XHR0aGlzLnN1Y2Nlc3NMaXN0LnB1c2goIGVsZW1lbnQgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gUmV0dXJuIHRoZSBjdXN0b20gbWVzc2FnZSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQgYW5kIHZhbGlkYXRpb24gbWV0aG9kXHJcblx0XHQvLyBzcGVjaWZpZWQgaW4gdGhlIGVsZW1lbnQncyBIVE1MNSBkYXRhIGF0dHJpYnV0ZVxyXG5cdFx0Ly8gcmV0dXJuIHRoZSBnZW5lcmljIG1lc3NhZ2UgaWYgcHJlc2VudCBhbmQgbm8gbWV0aG9kIHNwZWNpZmljIG1lc3NhZ2UgaXMgcHJlc2VudFxyXG5cdFx0Y3VzdG9tRGF0YU1lc3NhZ2U6IGZ1bmN0aW9uKCBlbGVtZW50LCBtZXRob2QgKSB7XHJcblx0XHRcdHJldHVybiAkKCBlbGVtZW50ICkuZGF0YSggXCJtc2dcIiArIG1ldGhvZC5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICtcclxuXHRcdFx0XHRtZXRob2Quc3Vic3RyaW5nKCAxICkudG9Mb3dlckNhc2UoKSApIHx8ICQoIGVsZW1lbnQgKS5kYXRhKCBcIm1zZ1wiICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIFJldHVybiB0aGUgY3VzdG9tIG1lc3NhZ2UgZm9yIHRoZSBnaXZlbiBlbGVtZW50IG5hbWUgYW5kIHZhbGlkYXRpb24gbWV0aG9kXHJcblx0XHRjdXN0b21NZXNzYWdlOiBmdW5jdGlvbiggbmFtZSwgbWV0aG9kICkge1xyXG5cdFx0XHR2YXIgbSA9IHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIG5hbWUgXTtcclxuXHRcdFx0cmV0dXJuIG0gJiYgKCBtLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgPyBtIDogbVsgbWV0aG9kIF0gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gUmV0dXJuIHRoZSBmaXJzdCBkZWZpbmVkIGFyZ3VtZW50LCBhbGxvd2luZyBlbXB0eSBzdHJpbmdzXHJcblx0XHRmaW5kRGVmaW5lZDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyApIHtcclxuXHRcdFx0XHRpZiAoIGFyZ3VtZW50c1sgaSBdICE9PSB1bmRlZmluZWQgKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYXJndW1lbnRzWyBpIF07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIFRoZSBzZWNvbmQgcGFyYW1ldGVyICdydWxlJyB1c2VkIHRvIGJlIGEgc3RyaW5nLCBhbmQgZXh0ZW5kZWQgdG8gYW4gb2JqZWN0IGxpdGVyYWxcclxuXHRcdC8vIG9mIHRoZSBmb2xsb3dpbmcgZm9ybTpcclxuXHRcdC8vIHJ1bGUgPSB7XHJcblx0XHQvLyAgICAgbWV0aG9kOiBcIm1ldGhvZCBuYW1lXCIsXHJcblx0XHQvLyAgICAgcGFyYW1ldGVyczogXCJ0aGUgZ2l2ZW4gbWV0aG9kIHBhcmFtZXRlcnNcIlxyXG5cdFx0Ly8gfVxyXG5cdFx0Ly9cclxuXHRcdC8vIFRoZSBvbGQgYmVoYXZpb3Igc3RpbGwgc3VwcG9ydGVkLCBrZXB0IHRvIG1haW50YWluIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aFxyXG5cdFx0Ly8gb2xkIGNvZGUsIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZS5cclxuXHRcdGRlZmF1bHRNZXNzYWdlOiBmdW5jdGlvbiggZWxlbWVudCwgcnVsZSApIHtcclxuXHRcdFx0aWYgKCB0eXBlb2YgcnVsZSA9PT0gXCJzdHJpbmdcIiApIHtcclxuXHRcdFx0XHRydWxlID0geyBtZXRob2Q6IHJ1bGUgfTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIG1lc3NhZ2UgPSB0aGlzLmZpbmREZWZpbmVkKFxyXG5cdFx0XHRcdFx0dGhpcy5jdXN0b21NZXNzYWdlKCBlbGVtZW50Lm5hbWUsIHJ1bGUubWV0aG9kICksXHJcblx0XHRcdFx0XHR0aGlzLmN1c3RvbURhdGFNZXNzYWdlKCBlbGVtZW50LCBydWxlLm1ldGhvZCApLFxyXG5cclxuXHRcdFx0XHRcdC8vICd0aXRsZScgaXMgbmV2ZXIgdW5kZWZpbmVkLCBzbyBoYW5kbGUgZW1wdHkgc3RyaW5nIGFzIHVuZGVmaW5lZFxyXG5cdFx0XHRcdFx0IXRoaXMuc2V0dGluZ3MuaWdub3JlVGl0bGUgJiYgZWxlbWVudC50aXRsZSB8fCB1bmRlZmluZWQsXHJcblx0XHRcdFx0XHQkLnZhbGlkYXRvci5tZXNzYWdlc1sgcnVsZS5tZXRob2QgXSxcclxuXHRcdFx0XHRcdFwiPHN0cm9uZz5XYXJuaW5nOiBObyBtZXNzYWdlIGRlZmluZWQgZm9yIFwiICsgZWxlbWVudC5uYW1lICsgXCI8L3N0cm9uZz5cIlxyXG5cdFx0XHRcdCksXHJcblx0XHRcdFx0dGhlcmVnZXggPSAvXFwkP1xceyhcXGQrKVxcfS9nO1xyXG5cdFx0XHRpZiAoIHR5cGVvZiBtZXNzYWdlID09PSBcImZ1bmN0aW9uXCIgKSB7XHJcblx0XHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UuY2FsbCggdGhpcywgcnVsZS5wYXJhbWV0ZXJzLCBlbGVtZW50ICk7XHJcblx0XHRcdH0gZWxzZSBpZiAoIHRoZXJlZ2V4LnRlc3QoIG1lc3NhZ2UgKSApIHtcclxuXHRcdFx0XHRtZXNzYWdlID0gJC52YWxpZGF0b3IuZm9ybWF0KCBtZXNzYWdlLnJlcGxhY2UoIHRoZXJlZ2V4LCBcInskMX1cIiApLCBydWxlLnBhcmFtZXRlcnMgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG1lc3NhZ2U7XHJcblx0XHR9LFxyXG5cclxuXHRcdGZvcm1hdEFuZEFkZDogZnVuY3Rpb24oIGVsZW1lbnQsIHJ1bGUgKSB7XHJcblx0XHRcdHZhciBtZXNzYWdlID0gdGhpcy5kZWZhdWx0TWVzc2FnZSggZWxlbWVudCwgcnVsZSApO1xyXG5cclxuXHRcdFx0dGhpcy5lcnJvckxpc3QucHVzaCgge1xyXG5cdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXHJcblx0XHRcdFx0ZWxlbWVudDogZWxlbWVudCxcclxuXHRcdFx0XHRtZXRob2Q6IHJ1bGUubWV0aG9kXHJcblx0XHRcdH0gKTtcclxuXHJcblx0XHRcdHRoaXMuZXJyb3JNYXBbIGVsZW1lbnQubmFtZSBdID0gbWVzc2FnZTtcclxuXHRcdFx0dGhpcy5zdWJtaXR0ZWRbIGVsZW1lbnQubmFtZSBdID0gbWVzc2FnZTtcclxuXHRcdH0sXHJcblxyXG5cdFx0YWRkV3JhcHBlcjogZnVuY3Rpb24oIHRvVG9nZ2xlICkge1xyXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Mud3JhcHBlciApIHtcclxuXHRcdFx0XHR0b1RvZ2dsZSA9IHRvVG9nZ2xlLmFkZCggdG9Ub2dnbGUucGFyZW50KCB0aGlzLnNldHRpbmdzLndyYXBwZXIgKSApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0b1RvZ2dsZTtcclxuXHRcdH0sXHJcblxyXG5cdFx0ZGVmYXVsdFNob3dFcnJvcnM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgaSwgZWxlbWVudHMsIGVycm9yO1xyXG5cdFx0XHRmb3IgKCBpID0gMDsgdGhpcy5lcnJvckxpc3RbIGkgXTsgaSsrICkge1xyXG5cdFx0XHRcdGVycm9yID0gdGhpcy5lcnJvckxpc3RbIGkgXTtcclxuXHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuaGlnaGxpZ2h0ICkge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5oaWdobGlnaHQuY2FsbCggdGhpcywgZXJyb3IuZWxlbWVudCwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zaG93TGFiZWwoIGVycm9yLmVsZW1lbnQsIGVycm9yLm1lc3NhZ2UgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIHRoaXMuZXJyb3JMaXN0Lmxlbmd0aCApIHtcclxuXHRcdFx0XHR0aGlzLnRvU2hvdyA9IHRoaXMudG9TaG93LmFkZCggdGhpcy5jb250YWluZXJzICk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLnN1Y2Nlc3MgKSB7XHJcblx0XHRcdFx0Zm9yICggaSA9IDA7IHRoaXMuc3VjY2Vzc0xpc3RbIGkgXTsgaSsrICkge1xyXG5cdFx0XHRcdFx0dGhpcy5zaG93TGFiZWwoIHRoaXMuc3VjY2Vzc0xpc3RbIGkgXSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQgKSB7XHJcblx0XHRcdFx0Zm9yICggaSA9IDAsIGVsZW1lbnRzID0gdGhpcy52YWxpZEVsZW1lbnRzKCk7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcclxuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQuY2FsbCggdGhpcywgZWxlbWVudHNbIGkgXSwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLnRvSGlkZS5ub3QoIHRoaXMudG9TaG93ICk7XHJcblx0XHRcdHRoaXMuaGlkZUVycm9ycygpO1xyXG5cdFx0XHR0aGlzLmFkZFdyYXBwZXIoIHRoaXMudG9TaG93ICkuc2hvdygpO1xyXG5cdFx0fSxcclxuXHJcblx0XHR2YWxpZEVsZW1lbnRzOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY3VycmVudEVsZW1lbnRzLm5vdCggdGhpcy5pbnZhbGlkRWxlbWVudHMoKSApO1xyXG5cdFx0fSxcclxuXHJcblx0XHRpbnZhbGlkRWxlbWVudHM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gJCggdGhpcy5lcnJvckxpc3QgKS5tYXAoIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLmVsZW1lbnQ7XHJcblx0XHRcdH0gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0c2hvd0xhYmVsOiBmdW5jdGlvbiggZWxlbWVudCwgbWVzc2FnZSApIHtcclxuXHRcdFx0dmFyIHBsYWNlLCBncm91cCwgZXJyb3JJRCwgdixcclxuXHRcdFx0XHRlcnJvciA9IHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICksXHJcblx0XHRcdFx0ZWxlbWVudElEID0gdGhpcy5pZE9yTmFtZSggZWxlbWVudCApLFxyXG5cdFx0XHRcdGRlc2NyaWJlZEJ5ID0gJCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1kZXNjcmliZWRieVwiICk7XHJcblxyXG5cdFx0XHRpZiAoIGVycm9yLmxlbmd0aCApIHtcclxuXHJcblx0XHRcdFx0Ly8gUmVmcmVzaCBlcnJvci9zdWNjZXNzIGNsYXNzXHJcblx0XHRcdFx0ZXJyb3IucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyApLmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MgKTtcclxuXHJcblx0XHRcdFx0Ly8gUmVwbGFjZSBtZXNzYWdlIG9uIGV4aXN0aW5nIGxhYmVsXHJcblx0XHRcdFx0ZXJyb3IuaHRtbCggbWVzc2FnZSApO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHQvLyBDcmVhdGUgZXJyb3IgZWxlbWVudFxyXG5cdFx0XHRcdGVycm9yID0gJCggXCI8XCIgKyB0aGlzLnNldHRpbmdzLmVycm9yRWxlbWVudCArIFwiPlwiIClcclxuXHRcdFx0XHRcdC5hdHRyKCBcImlkXCIsIGVsZW1lbnRJRCArIFwiLWVycm9yXCIgKVxyXG5cdFx0XHRcdFx0LmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MgKVxyXG5cdFx0XHRcdFx0Lmh0bWwoIG1lc3NhZ2UgfHwgXCJcIiApO1xyXG5cclxuXHRcdFx0XHQvLyBNYWludGFpbiByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgdG8gYmUgcGxhY2VkIGludG8gdGhlIERPTVxyXG5cdFx0XHRcdHBsYWNlID0gZXJyb3I7XHJcblx0XHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLndyYXBwZXIgKSB7XHJcblxyXG5cdFx0XHRcdFx0Ly8gTWFrZSBzdXJlIHRoZSBlbGVtZW50IGlzIHZpc2libGUsIGV2ZW4gaW4gSUVcclxuXHRcdFx0XHRcdC8vIGFjdHVhbGx5IHNob3dpbmcgdGhlIHdyYXBwZWQgZWxlbWVudCBpcyBoYW5kbGVkIGVsc2V3aGVyZVxyXG5cdFx0XHRcdFx0cGxhY2UgPSBlcnJvci5oaWRlKCkuc2hvdygpLndyYXAoIFwiPFwiICsgdGhpcy5zZXR0aW5ncy53cmFwcGVyICsgXCIvPlwiICkucGFyZW50KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggdGhpcy5sYWJlbENvbnRhaW5lci5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHR0aGlzLmxhYmVsQ29udGFpbmVyLmFwcGVuZCggcGxhY2UgKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKCB0aGlzLnNldHRpbmdzLmVycm9yUGxhY2VtZW50ICkge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5lcnJvclBsYWNlbWVudC5jYWxsKCB0aGlzLCBwbGFjZSwgJCggZWxlbWVudCApICk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHBsYWNlLmluc2VydEFmdGVyKCBlbGVtZW50ICk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBMaW5rIGVycm9yIGJhY2sgdG8gdGhlIGVsZW1lbnRcclxuXHRcdFx0XHRpZiAoIGVycm9yLmlzKCBcImxhYmVsXCIgKSApIHtcclxuXHJcblx0XHRcdFx0XHQvLyBJZiB0aGUgZXJyb3IgaXMgYSBsYWJlbCwgdGhlbiBhc3NvY2lhdGUgdXNpbmcgJ2ZvcidcclxuXHRcdFx0XHRcdGVycm9yLmF0dHIoIFwiZm9yXCIsIGVsZW1lbnRJRCApO1xyXG5cclxuXHRcdFx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIG5vdCBhIGNoaWxkIG9mIGFuIGFzc29jaWF0ZWQgbGFiZWwsIHRoZW4gaXQncyBuZWNlc3NhcnlcclxuXHRcdFx0XHRcdC8vIHRvIGV4cGxpY2l0bHkgYXBwbHkgYXJpYS1kZXNjcmliZWRieVxyXG5cdFx0XHRcdH0gZWxzZSBpZiAoIGVycm9yLnBhcmVudHMoIFwibGFiZWxbZm9yPSdcIiArIHRoaXMuZXNjYXBlQ3NzTWV0YSggZWxlbWVudElEICkgKyBcIiddXCIgKS5sZW5ndGggPT09IDAgKSB7XHJcblx0XHRcdFx0XHRlcnJvcklEID0gZXJyb3IuYXR0ciggXCJpZFwiICk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gUmVzcGVjdCBleGlzdGluZyBub24tZXJyb3IgYXJpYS1kZXNjcmliZWRieVxyXG5cdFx0XHRcdFx0aWYgKCAhZGVzY3JpYmVkQnkgKSB7XHJcblx0XHRcdFx0XHRcdGRlc2NyaWJlZEJ5ID0gZXJyb3JJRDtcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoICFkZXNjcmliZWRCeS5tYXRjaCggbmV3IFJlZ0V4cCggXCJcXFxcYlwiICsgdGhpcy5lc2NhcGVDc3NNZXRhKCBlcnJvcklEICkgKyBcIlxcXFxiXCIgKSApICkge1xyXG5cclxuXHRcdFx0XHRcdFx0Ly8gQWRkIHRvIGVuZCBvZiBsaXN0IGlmIG5vdCBhbHJlYWR5IHByZXNlbnRcclxuXHRcdFx0XHRcdFx0ZGVzY3JpYmVkQnkgKz0gXCIgXCIgKyBlcnJvcklEO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0JCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1kZXNjcmliZWRieVwiLCBkZXNjcmliZWRCeSApO1xyXG5cclxuXHRcdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBpcyBncm91cGVkLCB0aGVuIGFzc2lnbiB0byBhbGwgZWxlbWVudHMgaW4gdGhlIHNhbWUgZ3JvdXBcclxuXHRcdFx0XHRcdGdyb3VwID0gdGhpcy5ncm91cHNbIGVsZW1lbnQubmFtZSBdO1xyXG5cdFx0XHRcdFx0aWYgKCBncm91cCApIHtcclxuXHRcdFx0XHRcdFx0diA9IHRoaXM7XHJcblx0XHRcdFx0XHRcdCQuZWFjaCggdi5ncm91cHMsIGZ1bmN0aW9uKCBuYW1lLCB0ZXN0Z3JvdXAgKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCB0ZXN0Z3JvdXAgPT09IGdyb3VwICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JCggXCJbbmFtZT0nXCIgKyB2LmVzY2FwZUNzc01ldGEoIG5hbWUgKSArIFwiJ11cIiwgdi5jdXJyZW50Rm9ybSApXHJcblx0XHRcdFx0XHRcdFx0XHRcdC5hdHRyKCBcImFyaWEtZGVzY3JpYmVkYnlcIiwgZXJyb3IuYXR0ciggXCJpZFwiICkgKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0gKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCAhbWVzc2FnZSAmJiB0aGlzLnNldHRpbmdzLnN1Y2Nlc3MgKSB7XHJcblx0XHRcdFx0ZXJyb3IudGV4dCggXCJcIiApO1xyXG5cdFx0XHRcdGlmICggdHlwZW9mIHRoaXMuc2V0dGluZ3Muc3VjY2VzcyA9PT0gXCJzdHJpbmdcIiApIHtcclxuXHRcdFx0XHRcdGVycm9yLmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLnN1Y2Nlc3MgKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5zdWNjZXNzKCBlcnJvciwgZWxlbWVudCApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnRvU2hvdyA9IHRoaXMudG9TaG93LmFkZCggZXJyb3IgKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0ZXJyb3JzRm9yOiBmdW5jdGlvbiggZWxlbWVudCApIHtcclxuXHRcdFx0dmFyIG5hbWUgPSB0aGlzLmVzY2FwZUNzc01ldGEoIHRoaXMuaWRPck5hbWUoIGVsZW1lbnQgKSApLFxyXG5cdFx0XHRcdGRlc2NyaWJlciA9ICQoIGVsZW1lbnQgKS5hdHRyKCBcImFyaWEtZGVzY3JpYmVkYnlcIiApLFxyXG5cdFx0XHRcdHNlbGVjdG9yID0gXCJsYWJlbFtmb3I9J1wiICsgbmFtZSArIFwiJ10sIGxhYmVsW2Zvcj0nXCIgKyBuYW1lICsgXCInXSAqXCI7XHJcblxyXG5cdFx0XHQvLyAnYXJpYS1kZXNjcmliZWRieScgc2hvdWxkIGRpcmVjdGx5IHJlZmVyZW5jZSB0aGUgZXJyb3IgZWxlbWVudFxyXG5cdFx0XHRpZiAoIGRlc2NyaWJlciApIHtcclxuXHRcdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yICsgXCIsICNcIiArIHRoaXMuZXNjYXBlQ3NzTWV0YSggZGVzY3JpYmVyIClcclxuXHRcdFx0XHRcdC5yZXBsYWNlKCAvXFxzKy9nLCBcIiwgI1wiICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHRcdFx0LmVycm9ycygpXHJcblx0XHRcdFx0LmZpbHRlciggc2VsZWN0b3IgKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gU2VlIGh0dHBzOi8vYXBpLmpxdWVyeS5jb20vY2F0ZWdvcnkvc2VsZWN0b3JzLywgZm9yIENTU1xyXG5cdFx0Ly8gbWV0YS1jaGFyYWN0ZXJzIHRoYXQgc2hvdWxkIGJlIGVzY2FwZWQgaW4gb3JkZXIgdG8gYmUgdXNlZCB3aXRoIEpRdWVyeVxyXG5cdFx0Ly8gYXMgYSBsaXRlcmFsIHBhcnQgb2YgYSBuYW1lL2lkIG9yIGFueSBzZWxlY3Rvci5cclxuXHRcdGVzY2FwZUNzc01ldGE6IGZ1bmN0aW9uKCBzdHJpbmcgKSB7XHJcblx0XHRcdHJldHVybiBzdHJpbmcucmVwbGFjZSggLyhbXFxcXCFcIiMkJSYnKCkqKywuLzo7PD0+P0BcXFtcXF1eYHt8fX5dKS9nLCBcIlxcXFwkMVwiICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdGlkT3JOYW1lOiBmdW5jdGlvbiggZWxlbWVudCApIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuZ3JvdXBzWyBlbGVtZW50Lm5hbWUgXSB8fCAoIHRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgPyBlbGVtZW50Lm5hbWUgOiBlbGVtZW50LmlkIHx8IGVsZW1lbnQubmFtZSApO1xyXG5cdFx0fSxcclxuXHJcblx0XHR2YWxpZGF0aW9uVGFyZ2V0Rm9yOiBmdW5jdGlvbiggZWxlbWVudCApIHtcclxuXHJcblx0XHRcdC8vIElmIHJhZGlvL2NoZWNrYm94LCB2YWxpZGF0ZSBmaXJzdCBlbGVtZW50IGluIGdyb3VwIGluc3RlYWRcclxuXHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xyXG5cdFx0XHRcdGVsZW1lbnQgPSB0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBBbHdheXMgYXBwbHkgaWdub3JlIGZpbHRlclxyXG5cdFx0XHRyZXR1cm4gJCggZWxlbWVudCApLm5vdCggdGhpcy5zZXR0aW5ncy5pZ25vcmUgKVsgMCBdO1xyXG5cdFx0fSxcclxuXHJcblx0XHRjaGVja2FibGU6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0XHRyZXR1cm4gKCAvcmFkaW98Y2hlY2tib3gvaSApLnRlc3QoIGVsZW1lbnQudHlwZSApO1xyXG5cdFx0fSxcclxuXHJcblx0XHRmaW5kQnlOYW1lOiBmdW5jdGlvbiggbmFtZSApIHtcclxuXHRcdFx0cmV0dXJuICQoIHRoaXMuY3VycmVudEZvcm0gKS5maW5kKCBcIltuYW1lPSdcIiArIHRoaXMuZXNjYXBlQ3NzTWV0YSggbmFtZSApICsgXCInXVwiICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdGdldExlbmd0aDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50ICkge1xyXG5cdFx0XHRzd2l0Y2ggKCBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgKSB7XHJcblx0XHRcdGNhc2UgXCJzZWxlY3RcIjpcclxuXHRcdFx0XHRyZXR1cm4gJCggXCJvcHRpb246c2VsZWN0ZWRcIiwgZWxlbWVudCApLmxlbmd0aDtcclxuXHRcdFx0Y2FzZSBcImlucHV0XCI6XHJcblx0XHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZmluZEJ5TmFtZSggZWxlbWVudC5uYW1lICkuZmlsdGVyKCBcIjpjaGVja2VkXCIgKS5sZW5ndGg7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB2YWx1ZS5sZW5ndGg7XHJcblx0XHR9LFxyXG5cclxuXHRcdGRlcGVuZDogZnVuY3Rpb24oIHBhcmFtLCBlbGVtZW50ICkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5kZXBlbmRUeXBlc1sgdHlwZW9mIHBhcmFtIF0gPyB0aGlzLmRlcGVuZFR5cGVzWyB0eXBlb2YgcGFyYW0gXSggcGFyYW0sIGVsZW1lbnQgKSA6IHRydWU7XHJcblx0XHR9LFxyXG5cclxuXHRcdGRlcGVuZFR5cGVzOiB7XHJcblx0XHRcdFwiYm9vbGVhblwiOiBmdW5jdGlvbiggcGFyYW0gKSB7XHJcblx0XHRcdFx0cmV0dXJuIHBhcmFtO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRcInN0cmluZ1wiOiBmdW5jdGlvbiggcGFyYW0sIGVsZW1lbnQgKSB7XHJcblx0XHRcdFx0cmV0dXJuICEhJCggcGFyYW0sIGVsZW1lbnQuZm9ybSApLmxlbmd0aDtcclxuXHRcdFx0fSxcclxuXHRcdFx0XCJmdW5jdGlvblwiOiBmdW5jdGlvbiggcGFyYW0sIGVsZW1lbnQgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHBhcmFtKCBlbGVtZW50ICk7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblxyXG5cdFx0b3B0aW9uYWw6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0XHR2YXIgdmFsID0gdGhpcy5lbGVtZW50VmFsdWUoIGVsZW1lbnQgKTtcclxuXHRcdFx0cmV0dXJuICEkLnZhbGlkYXRvci5tZXRob2RzLnJlcXVpcmVkLmNhbGwoIHRoaXMsIHZhbCwgZWxlbWVudCApICYmIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiO1xyXG5cdFx0fSxcclxuXHJcblx0XHRzdGFydFJlcXVlc3Q6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0XHRpZiAoICF0aGlzLnBlbmRpbmdbIGVsZW1lbnQubmFtZSBdICkge1xyXG5cdFx0XHRcdHRoaXMucGVuZGluZ1JlcXVlc3QrKztcclxuXHRcdFx0XHQkKCBlbGVtZW50ICkuYWRkQ2xhc3MoIHRoaXMuc2V0dGluZ3MucGVuZGluZ0NsYXNzICk7XHJcblx0XHRcdFx0dGhpcy5wZW5kaW5nWyBlbGVtZW50Lm5hbWUgXSA9IHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblxyXG5cdFx0c3RvcFJlcXVlc3Q6IGZ1bmN0aW9uKCBlbGVtZW50LCB2YWxpZCApIHtcclxuXHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdC0tO1xyXG5cclxuXHRcdFx0Ly8gU29tZXRpbWVzIHN5bmNocm9uaXphdGlvbiBmYWlscywgbWFrZSBzdXJlIHBlbmRpbmdSZXF1ZXN0IGlzIG5ldmVyIDwgMFxyXG5cdFx0XHRpZiAoIHRoaXMucGVuZGluZ1JlcXVlc3QgPCAwICkge1xyXG5cdFx0XHRcdHRoaXMucGVuZGluZ1JlcXVlc3QgPSAwO1xyXG5cdFx0XHR9XHJcblx0XHRcdGRlbGV0ZSB0aGlzLnBlbmRpbmdbIGVsZW1lbnQubmFtZSBdO1xyXG5cdFx0XHQkKCBlbGVtZW50ICkucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MucGVuZGluZ0NsYXNzICk7XHJcblx0XHRcdGlmICggdmFsaWQgJiYgdGhpcy5wZW5kaW5nUmVxdWVzdCA9PT0gMCAmJiB0aGlzLmZvcm1TdWJtaXR0ZWQgJiYgdGhpcy5mb3JtKCkgKSB7XHJcblx0XHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApLnN1Ym1pdCgpO1xyXG5cclxuXHRcdFx0XHQvLyBSZW1vdmUgdGhlIGhpZGRlbiBpbnB1dCB0aGF0IHdhcyB1c2VkIGFzIGEgcmVwbGFjZW1lbnQgZm9yIHRoZVxyXG5cdFx0XHRcdC8vIG1pc3Npbmcgc3VibWl0IGJ1dHRvbi4gVGhlIGhpZGRlbiBpbnB1dCBpcyBhZGRlZCBieSBgaGFuZGxlKClgXHJcblx0XHRcdFx0Ly8gdG8gZW5zdXJlIHRoYXQgdGhlIHZhbHVlIG9mIHRoZSB1c2VkIHN1Ym1pdCBidXR0b24gaXMgcGFzc2VkIG9uXHJcblx0XHRcdFx0Ly8gZm9yIHNjcmlwdGVkIHN1Ym1pdHMgdHJpZ2dlcmVkIGJ5IHRoaXMgbWV0aG9kXHJcblx0XHRcdFx0aWYgKCB0aGlzLnN1Ym1pdEJ1dHRvbiApIHtcclxuXHRcdFx0XHRcdCQoIFwiaW5wdXQ6aGlkZGVuW25hbWU9J1wiICsgdGhpcy5zdWJtaXRCdXR0b24ubmFtZSArIFwiJ11cIiwgdGhpcy5jdXJyZW50Rm9ybSApLnJlbW92ZSgpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dGhpcy5mb3JtU3VibWl0dGVkID0gZmFsc2U7XHJcblx0XHRcdH0gZWxzZSBpZiAoICF2YWxpZCAmJiB0aGlzLnBlbmRpbmdSZXF1ZXN0ID09PSAwICYmIHRoaXMuZm9ybVN1Ym1pdHRlZCApIHtcclxuXHRcdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtICkudHJpZ2dlckhhbmRsZXIoIFwiaW52YWxpZC1mb3JtXCIsIFsgdGhpcyBdICk7XHJcblx0XHRcdFx0dGhpcy5mb3JtU3VibWl0dGVkID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblxyXG5cdFx0cHJldmlvdXNWYWx1ZTogZnVuY3Rpb24oIGVsZW1lbnQsIG1ldGhvZCApIHtcclxuXHRcdFx0bWV0aG9kID0gdHlwZW9mIG1ldGhvZCA9PT0gXCJzdHJpbmdcIiAmJiBtZXRob2QgfHwgXCJyZW1vdGVcIjtcclxuXHJcblx0XHRcdHJldHVybiAkLmRhdGEoIGVsZW1lbnQsIFwicHJldmlvdXNWYWx1ZVwiICkgfHwgJC5kYXRhKCBlbGVtZW50LCBcInByZXZpb3VzVmFsdWVcIiwge1xyXG5cdFx0XHRcdG9sZDogbnVsbCxcclxuXHRcdFx0XHR2YWxpZDogdHJ1ZSxcclxuXHRcdFx0XHRtZXNzYWdlOiB0aGlzLmRlZmF1bHRNZXNzYWdlKCBlbGVtZW50LCB7IG1ldGhvZDogbWV0aG9kIH0gKVxyXG5cdFx0XHR9ICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIENsZWFucyB1cCBhbGwgZm9ybXMgYW5kIGVsZW1lbnRzLCByZW1vdmVzIHZhbGlkYXRvci1zcGVjaWZpYyBldmVudHNcclxuXHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGlzLnJlc2V0Rm9ybSgpO1xyXG5cclxuXHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApXHJcblx0XHRcdFx0Lm9mZiggXCIudmFsaWRhdGVcIiApXHJcblx0XHRcdFx0LnJlbW92ZURhdGEoIFwidmFsaWRhdG9yXCIgKVxyXG5cdFx0XHRcdC5maW5kKCBcIi52YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApXHJcblx0XHRcdFx0XHQub2ZmKCBcIi52YWxpZGF0ZS1lcXVhbFRvXCIgKVxyXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCBcInZhbGlkYXRlLWVxdWFsVG8tYmx1clwiIClcclxuXHRcdFx0XHQuZmluZCggXCIudmFsaWRhdGUtbGVzc1RoYW4tYmx1clwiIClcclxuXHRcdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlLWxlc3NUaGFuXCIgKVxyXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCBcInZhbGlkYXRlLWxlc3NUaGFuLWJsdXJcIiApXHJcblx0XHRcdFx0LmZpbmQoIFwiLnZhbGlkYXRlLWxlc3NUaGFuRXF1YWwtYmx1clwiIClcclxuXHRcdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlLWxlc3NUaGFuRXF1YWxcIiApXHJcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoIFwidmFsaWRhdGUtbGVzc1RoYW5FcXVhbC1ibHVyXCIgKVxyXG5cdFx0XHRcdC5maW5kKCBcIi52YWxpZGF0ZS1ncmVhdGVyVGhhbkVxdWFsLWJsdXJcIiApXHJcblx0XHRcdFx0XHQub2ZmKCBcIi52YWxpZGF0ZS1ncmVhdGVyVGhhbkVxdWFsXCIgKVxyXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCBcInZhbGlkYXRlLWdyZWF0ZXJUaGFuRXF1YWwtYmx1clwiIClcclxuXHRcdFx0XHQuZmluZCggXCIudmFsaWRhdGUtZ3JlYXRlclRoYW4tYmx1clwiIClcclxuXHRcdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlLWdyZWF0ZXJUaGFuXCIgKVxyXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCBcInZhbGlkYXRlLWdyZWF0ZXJUaGFuLWJsdXJcIiApO1xyXG5cdFx0fVxyXG5cclxuXHR9LFxyXG5cclxuXHRjbGFzc1J1bGVTZXR0aW5nczoge1xyXG5cdFx0cmVxdWlyZWQ6IHsgcmVxdWlyZWQ6IHRydWUgfSxcclxuXHRcdGVtYWlsOiB7IGVtYWlsOiB0cnVlIH0sXHJcblx0XHR1cmw6IHsgdXJsOiB0cnVlIH0sXHJcblx0XHRkYXRlOiB7IGRhdGU6IHRydWUgfSxcclxuXHRcdGRhdGVJU086IHsgZGF0ZUlTTzogdHJ1ZSB9LFxyXG5cdFx0bnVtYmVyOiB7IG51bWJlcjogdHJ1ZSB9LFxyXG5cdFx0ZGlnaXRzOiB7IGRpZ2l0czogdHJ1ZSB9LFxyXG5cdFx0Y3JlZGl0Y2FyZDogeyBjcmVkaXRjYXJkOiB0cnVlIH1cclxuXHR9LFxyXG5cclxuXHRhZGRDbGFzc1J1bGVzOiBmdW5jdGlvbiggY2xhc3NOYW1lLCBydWxlcyApIHtcclxuXHRcdGlmICggY2xhc3NOYW1lLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgKSB7XHJcblx0XHRcdHRoaXMuY2xhc3NSdWxlU2V0dGluZ3NbIGNsYXNzTmFtZSBdID0gcnVsZXM7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHQkLmV4dGVuZCggdGhpcy5jbGFzc1J1bGVTZXR0aW5ncywgY2xhc3NOYW1lICk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Y2xhc3NSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XHJcblx0XHR2YXIgcnVsZXMgPSB7fSxcclxuXHRcdFx0Y2xhc3NlcyA9ICQoIGVsZW1lbnQgKS5hdHRyKCBcImNsYXNzXCIgKTtcclxuXHJcblx0XHRpZiAoIGNsYXNzZXMgKSB7XHJcblx0XHRcdCQuZWFjaCggY2xhc3Nlcy5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYgKCB0aGlzIGluICQudmFsaWRhdG9yLmNsYXNzUnVsZVNldHRpbmdzICkge1xyXG5cdFx0XHRcdFx0JC5leHRlbmQoIHJ1bGVzLCAkLnZhbGlkYXRvci5jbGFzc1J1bGVTZXR0aW5nc1sgdGhpcyBdICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9ICk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcnVsZXM7XHJcblx0fSxcclxuXHJcblx0bm9ybWFsaXplQXR0cmlidXRlUnVsZTogZnVuY3Rpb24oIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICkge1xyXG5cclxuXHRcdC8vIENvbnZlcnQgdGhlIHZhbHVlIHRvIGEgbnVtYmVyIGZvciBudW1iZXIgaW5wdXRzLCBhbmQgZm9yIHRleHQgZm9yIGJhY2t3YXJkcyBjb21wYWJpbGl0eVxyXG5cdFx0Ly8gYWxsb3dzIHR5cGU9XCJkYXRlXCIgYW5kIG90aGVycyB0byBiZSBjb21wYXJlZCBhcyBzdHJpbmdzXHJcblx0XHRpZiAoIC9taW58bWF4fHN0ZXAvLnRlc3QoIG1ldGhvZCApICYmICggdHlwZSA9PT0gbnVsbCB8fCAvbnVtYmVyfHJhbmdlfHRleHQvLnRlc3QoIHR5cGUgKSApICkge1xyXG5cdFx0XHR2YWx1ZSA9IE51bWJlciggdmFsdWUgKTtcclxuXHJcblx0XHRcdC8vIFN1cHBvcnQgT3BlcmEgTWluaSwgd2hpY2ggcmV0dXJucyBOYU4gZm9yIHVuZGVmaW5lZCBtaW5sZW5ndGhcclxuXHRcdFx0aWYgKCBpc05hTiggdmFsdWUgKSApIHtcclxuXHRcdFx0XHR2YWx1ZSA9IHVuZGVmaW5lZDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICggdmFsdWUgfHwgdmFsdWUgPT09IDAgKSB7XHJcblx0XHRcdHJ1bGVzWyBtZXRob2QgXSA9IHZhbHVlO1xyXG5cdFx0fSBlbHNlIGlmICggdHlwZSA9PT0gbWV0aG9kICYmIHR5cGUgIT09IFwicmFuZ2VcIiApIHtcclxuXHJcblx0XHRcdC8vIEV4Y2VwdGlvbjogdGhlIGpxdWVyeSB2YWxpZGF0ZSAncmFuZ2UnIG1ldGhvZFxyXG5cdFx0XHQvLyBkb2VzIG5vdCB0ZXN0IGZvciB0aGUgaHRtbDUgJ3JhbmdlJyB0eXBlXHJcblx0XHRcdHJ1bGVzWyBtZXRob2QgXSA9IHRydWU7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0YXR0cmlidXRlUnVsZXM6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0dmFyIHJ1bGVzID0ge30sXHJcblx0XHRcdCRlbGVtZW50ID0gJCggZWxlbWVudCApLFxyXG5cdFx0XHR0eXBlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoIFwidHlwZVwiICksXHJcblx0XHRcdG1ldGhvZCwgdmFsdWU7XHJcblxyXG5cdFx0Zm9yICggbWV0aG9kIGluICQudmFsaWRhdG9yLm1ldGhvZHMgKSB7XHJcblxyXG5cdFx0XHQvLyBTdXBwb3J0IGZvciA8aW5wdXQgcmVxdWlyZWQ+IGluIGJvdGggaHRtbDUgYW5kIG9sZGVyIGJyb3dzZXJzXHJcblx0XHRcdGlmICggbWV0aG9kID09PSBcInJlcXVpcmVkXCIgKSB7XHJcblx0XHRcdFx0dmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggbWV0aG9kICk7XHJcblxyXG5cdFx0XHRcdC8vIFNvbWUgYnJvd3NlcnMgcmV0dXJuIGFuIGVtcHR5IHN0cmluZyBmb3IgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZVxyXG5cdFx0XHRcdC8vIGFuZCBub24tSFRNTDUgYnJvd3NlcnMgbWlnaHQgaGF2ZSByZXF1aXJlZD1cIlwiIG1hcmt1cFxyXG5cdFx0XHRcdGlmICggdmFsdWUgPT09IFwiXCIgKSB7XHJcblx0XHRcdFx0XHR2YWx1ZSA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBGb3JjZSBub24tSFRNTDUgYnJvd3NlcnMgdG8gcmV0dXJuIGJvb2xcclxuXHRcdFx0XHR2YWx1ZSA9ICEhdmFsdWU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dmFsdWUgPSAkZWxlbWVudC5hdHRyKCBtZXRob2QgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5ub3JtYWxpemVBdHRyaWJ1dGVSdWxlKCBydWxlcywgdHlwZSwgbWV0aG9kLCB2YWx1ZSApO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vICdtYXhsZW5ndGgnIG1heSBiZSByZXR1cm5lZCBhcyAtMSwgMjE0NzQ4MzY0NyAoIElFICkgYW5kIDUyNDI4OCAoIHNhZmFyaSApIGZvciB0ZXh0IGlucHV0c1xyXG5cdFx0aWYgKCBydWxlcy5tYXhsZW5ndGggJiYgLy0xfDIxNDc0ODM2NDd8NTI0Mjg4Ly50ZXN0KCBydWxlcy5tYXhsZW5ndGggKSApIHtcclxuXHRcdFx0ZGVsZXRlIHJ1bGVzLm1heGxlbmd0aDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcnVsZXM7XHJcblx0fSxcclxuXHJcblx0ZGF0YVJ1bGVzOiBmdW5jdGlvbiggZWxlbWVudCApIHtcclxuXHRcdHZhciBydWxlcyA9IHt9LFxyXG5cdFx0XHQkZWxlbWVudCA9ICQoIGVsZW1lbnQgKSxcclxuXHRcdFx0dHlwZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCBcInR5cGVcIiApLFxyXG5cdFx0XHRtZXRob2QsIHZhbHVlO1xyXG5cclxuXHRcdGZvciAoIG1ldGhvZCBpbiAkLnZhbGlkYXRvci5tZXRob2RzICkge1xyXG5cdFx0XHR2YWx1ZSA9ICRlbGVtZW50LmRhdGEoIFwicnVsZVwiICsgbWV0aG9kLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCkgKyBtZXRob2Quc3Vic3RyaW5nKCAxICkudG9Mb3dlckNhc2UoKSApO1xyXG5cclxuXHRcdFx0Ly8gQ2FzdCBlbXB0eSBhdHRyaWJ1dGVzIGxpa2UgYGRhdGEtcnVsZS1yZXF1aXJlZGAgdG8gYHRydWVgXHJcblx0XHRcdGlmICggdmFsdWUgPT09IFwiXCIgKSB7XHJcblx0XHRcdFx0dmFsdWUgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLm5vcm1hbGl6ZUF0dHJpYnV0ZVJ1bGUoIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcnVsZXM7XHJcblx0fSxcclxuXHJcblx0c3RhdGljUnVsZXM6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xyXG5cdFx0dmFyIHJ1bGVzID0ge30sXHJcblx0XHRcdHZhbGlkYXRvciA9ICQuZGF0YSggZWxlbWVudC5mb3JtLCBcInZhbGlkYXRvclwiICk7XHJcblxyXG5cdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3MucnVsZXMgKSB7XHJcblx0XHRcdHJ1bGVzID0gJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZSggdmFsaWRhdG9yLnNldHRpbmdzLnJ1bGVzWyBlbGVtZW50Lm5hbWUgXSApIHx8IHt9O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJ1bGVzO1xyXG5cdH0sXHJcblxyXG5cdG5vcm1hbGl6ZVJ1bGVzOiBmdW5jdGlvbiggcnVsZXMsIGVsZW1lbnQgKSB7XHJcblxyXG5cdFx0Ly8gSGFuZGxlIGRlcGVuZGVuY3kgY2hlY2tcclxuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBwcm9wLCB2YWwgKSB7XHJcblxyXG5cdFx0XHQvLyBJZ25vcmUgcnVsZSB3aGVuIHBhcmFtIGlzIGV4cGxpY2l0bHkgZmFsc2UsIGVnLiByZXF1aXJlZDpmYWxzZVxyXG5cdFx0XHRpZiAoIHZhbCA9PT0gZmFsc2UgKSB7XHJcblx0XHRcdFx0ZGVsZXRlIHJ1bGVzWyBwcm9wIF07XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICggdmFsLnBhcmFtIHx8IHZhbC5kZXBlbmRzICkge1xyXG5cdFx0XHRcdHZhciBrZWVwUnVsZSA9IHRydWU7XHJcblx0XHRcdFx0c3dpdGNoICggdHlwZW9mIHZhbC5kZXBlbmRzICkge1xyXG5cdFx0XHRcdGNhc2UgXCJzdHJpbmdcIjpcclxuXHRcdFx0XHRcdGtlZXBSdWxlID0gISEkKCB2YWwuZGVwZW5kcywgZWxlbWVudC5mb3JtICkubGVuZ3RoO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XHJcblx0XHRcdFx0XHRrZWVwUnVsZSA9IHZhbC5kZXBlbmRzLmNhbGwoIGVsZW1lbnQsIGVsZW1lbnQgKTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIGtlZXBSdWxlICkge1xyXG5cdFx0XHRcdFx0cnVsZXNbIHByb3AgXSA9IHZhbC5wYXJhbSAhPT0gdW5kZWZpbmVkID8gdmFsLnBhcmFtIDogdHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0JC5kYXRhKCBlbGVtZW50LmZvcm0sIFwidmFsaWRhdG9yXCIgKS5yZXNldEVsZW1lbnRzKCAkKCBlbGVtZW50ICkgKTtcclxuXHRcdFx0XHRcdGRlbGV0ZSBydWxlc1sgcHJvcCBdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSApO1xyXG5cclxuXHRcdC8vIEV2YWx1YXRlIHBhcmFtZXRlcnNcclxuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBydWxlLCBwYXJhbWV0ZXIgKSB7XHJcblx0XHRcdHJ1bGVzWyBydWxlIF0gPSB0eXBlb2YgcGFyYW1ldGVyID09PSBcImZ1bmN0aW9uXCIgJiYgcnVsZSAhPT0gXCJub3JtYWxpemVyXCIgPyBwYXJhbWV0ZXIoIGVsZW1lbnQgKSA6IHBhcmFtZXRlcjtcclxuXHRcdH0gKTtcclxuXHJcblx0XHQvLyBDbGVhbiBudW1iZXIgcGFyYW1ldGVyc1xyXG5cdFx0JC5lYWNoKCBbIFwibWlubGVuZ3RoXCIsIFwibWF4bGVuZ3RoXCIgXSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmICggcnVsZXNbIHRoaXMgXSApIHtcclxuXHRcdFx0XHRydWxlc1sgdGhpcyBdID0gTnVtYmVyKCBydWxlc1sgdGhpcyBdICk7XHJcblx0XHRcdH1cclxuXHRcdH0gKTtcclxuXHRcdCQuZWFjaCggWyBcInJhbmdlbGVuZ3RoXCIsIFwicmFuZ2VcIiBdLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIHBhcnRzO1xyXG5cdFx0XHRpZiAoIHJ1bGVzWyB0aGlzIF0gKSB7XHJcblx0XHRcdFx0aWYgKCBBcnJheS5pc0FycmF5KCBydWxlc1sgdGhpcyBdICkgKSB7XHJcblx0XHRcdFx0XHRydWxlc1sgdGhpcyBdID0gWyBOdW1iZXIoIHJ1bGVzWyB0aGlzIF1bIDAgXSApLCBOdW1iZXIoIHJ1bGVzWyB0aGlzIF1bIDEgXSApIF07XHJcblx0XHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHJ1bGVzWyB0aGlzIF0gPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHRcdFx0XHRwYXJ0cyA9IHJ1bGVzWyB0aGlzIF0ucmVwbGFjZSggL1tcXFtcXF1dL2csIFwiXCIgKS5zcGxpdCggL1tcXHMsXSsvICk7XHJcblx0XHRcdFx0XHRydWxlc1sgdGhpcyBdID0gWyBOdW1iZXIoIHBhcnRzWyAwIF0gKSwgTnVtYmVyKCBwYXJ0c1sgMSBdICkgXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0gKTtcclxuXHJcblx0XHRpZiAoICQudmFsaWRhdG9yLmF1dG9DcmVhdGVSYW5nZXMgKSB7XHJcblxyXG5cdFx0XHQvLyBBdXRvLWNyZWF0ZSByYW5nZXNcclxuXHRcdFx0aWYgKCBydWxlcy5taW4gIT0gbnVsbCAmJiBydWxlcy5tYXggIT0gbnVsbCApIHtcclxuXHRcdFx0XHRydWxlcy5yYW5nZSA9IFsgcnVsZXMubWluLCBydWxlcy5tYXggXTtcclxuXHRcdFx0XHRkZWxldGUgcnVsZXMubWluO1xyXG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5tYXg7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCBydWxlcy5taW5sZW5ndGggIT0gbnVsbCAmJiBydWxlcy5tYXhsZW5ndGggIT0gbnVsbCApIHtcclxuXHRcdFx0XHRydWxlcy5yYW5nZWxlbmd0aCA9IFsgcnVsZXMubWlubGVuZ3RoLCBydWxlcy5tYXhsZW5ndGggXTtcclxuXHRcdFx0XHRkZWxldGUgcnVsZXMubWlubGVuZ3RoO1xyXG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5tYXhsZW5ndGg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcnVsZXM7XHJcblx0fSxcclxuXHJcblx0Ly8gQ29udmVydHMgYSBzaW1wbGUgc3RyaW5nIHRvIGEge3N0cmluZzogdHJ1ZX0gcnVsZSwgZS5nLiwgXCJyZXF1aXJlZFwiIHRvIHtyZXF1aXJlZDp0cnVlfVxyXG5cdG5vcm1hbGl6ZVJ1bGU6IGZ1bmN0aW9uKCBkYXRhICkge1xyXG5cdFx0aWYgKCB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiApIHtcclxuXHRcdFx0dmFyIHRyYW5zZm9ybWVkID0ge307XHJcblx0XHRcdCQuZWFjaCggZGF0YS5zcGxpdCggL1xccy8gKSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dHJhbnNmb3JtZWRbIHRoaXMgXSA9IHRydWU7XHJcblx0XHRcdH0gKTtcclxuXHRcdFx0ZGF0YSA9IHRyYW5zZm9ybWVkO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fSxcclxuXHJcblx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9qUXVlcnkudmFsaWRhdG9yLmFkZE1ldGhvZC9cclxuXHRhZGRNZXRob2Q6IGZ1bmN0aW9uKCBuYW1lLCBtZXRob2QsIG1lc3NhZ2UgKSB7XHJcblx0XHQkLnZhbGlkYXRvci5tZXRob2RzWyBuYW1lIF0gPSBtZXRob2Q7XHJcblx0XHQkLnZhbGlkYXRvci5tZXNzYWdlc1sgbmFtZSBdID0gbWVzc2FnZSAhPT0gdW5kZWZpbmVkID8gbWVzc2FnZSA6ICQudmFsaWRhdG9yLm1lc3NhZ2VzWyBuYW1lIF07XHJcblx0XHRpZiAoIG1ldGhvZC5sZW5ndGggPCAzICkge1xyXG5cdFx0XHQkLnZhbGlkYXRvci5hZGRDbGFzc1J1bGVzKCBuYW1lLCAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCBuYW1lICkgKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2pRdWVyeS52YWxpZGF0b3IubWV0aG9kcy9cclxuXHRtZXRob2RzOiB7XHJcblxyXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9yZXF1aXJlZC1tZXRob2QvXHJcblx0XHRyZXF1aXJlZDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcclxuXHJcblx0XHRcdC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgaXMgbWV0XHJcblx0XHRcdGlmICggIXRoaXMuZGVwZW5kKCBwYXJhbSwgZWxlbWVudCApICkge1xyXG5cdFx0XHRcdHJldHVybiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJzZWxlY3RcIiApIHtcclxuXHJcblx0XHRcdFx0Ly8gQ291bGQgYmUgYW4gYXJyYXkgZm9yIHNlbGVjdC1tdWx0aXBsZSBvciBhIHN0cmluZywgYm90aCBhcmUgZmluZSB0aGlzIHdheVxyXG5cdFx0XHRcdHZhciB2YWwgPSAkKCBlbGVtZW50ICkudmFsKCk7XHJcblx0XHRcdFx0cmV0dXJuIHZhbCAmJiB2YWwubGVuZ3RoID4gMDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIHRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApID4gMDtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZS5sZW5ndGggPiAwO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2VtYWlsLW1ldGhvZC9cclxuXHRcdGVtYWlsOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XHJcblxyXG5cdFx0XHQvLyBGcm9tIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2Zvcm1zLmh0bWwjdmFsaWQtZS1tYWlsLWFkZHJlc3NcclxuXHRcdFx0Ly8gUmV0cmlldmVkIDIwMTQtMDEtMTRcclxuXHRcdFx0Ly8gSWYgeW91IGhhdmUgYSBwcm9ibGVtIHdpdGggdGhpcyBpbXBsZW1lbnRhdGlvbiwgcmVwb3J0IGEgYnVnIGFnYWluc3QgdGhlIGFib3ZlIHNwZWNcclxuXHRcdFx0Ly8gT3IgdXNlIGN1c3RvbSBtZXRob2RzIHRvIGltcGxlbWVudCB5b3VyIG93biBlbWFpbCB2YWxpZGF0aW9uXHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15bYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqJC8udGVzdCggdmFsdWUgKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy91cmwtbWV0aG9kL1xyXG5cdFx0dXJsOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XHJcblxyXG5cdFx0XHQvLyBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBEaWVnbyBQZXJpbmksIE1JVCBsaWNlbnNlZFxyXG5cdFx0XHQvLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9kcGVyaW5pLzcyOTI5NFxyXG5cdFx0XHQvLyBzZWUgYWxzbyBodHRwczovL21hdGhpYXNieW5lbnMuYmUvZGVtby91cmwtcmVnZXhcclxuXHRcdFx0Ly8gbW9kaWZpZWQgdG8gYWxsb3cgcHJvdG9jb2wtcmVsYXRpdmUgVVJMc1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IC9eKD86KD86KD86aHR0cHM/fGZ0cCk6KT9cXC9cXC8pKD86XFxTKyg/OjpcXFMqKT9AKT8oPzooPyEoPzoxMHwxMjcpKD86XFwuXFxkezEsM30pezN9KSg/ISg/OjE2OVxcLjI1NHwxOTJcXC4xNjgpKD86XFwuXFxkezEsM30pezJ9KSg/ITE3MlxcLig/OjFbNi05XXwyXFxkfDNbMC0xXSkoPzpcXC5cXGR7MSwzfSl7Mn0pKD86WzEtOV1cXGQ/fDFcXGRcXGR8MlswMV1cXGR8MjJbMC0zXSkoPzpcXC4oPzoxP1xcZHsxLDJ9fDJbMC00XVxcZHwyNVswLTVdKSl7Mn0oPzpcXC4oPzpbMS05XVxcZD98MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC00XSkpfCg/Oig/OlthLXowLTlcXHUwMGExLVxcdWZmZmZdW2EtejAtOVxcdTAwYTEtXFx1ZmZmZl8tXXswLDYyfSk/W2EtejAtOVxcdTAwYTEtXFx1ZmZmZl1cXC4pKyg/OlthLXpcXHUwMGExLVxcdWZmZmZdezIsfVxcLj8pKSg/OjpcXGR7Miw1fSk/KD86Wy8/I11cXFMqKT8kL2kudGVzdCggdmFsdWUgKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9kYXRlLW1ldGhvZC9cclxuXHRcdGRhdGU6ICggZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBjYWxsZWQgPSBmYWxzZTtcclxuXHJcblx0XHRcdHJldHVybiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XHJcblx0XHRcdFx0aWYgKCAhY2FsbGVkICkge1xyXG5cdFx0XHRcdFx0Y2FsbGVkID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5kZWJ1ZyAmJiB3aW5kb3cuY29uc29sZSApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFxyXG5cdFx0XHRcdFx0XHRcdFwiVGhlIGBkYXRlYCBtZXRob2QgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHZlcnNpb24gJzIuMC4wJy5cXG5cIiArXHJcblx0XHRcdFx0XHRcdFx0XCJQbGVhc2UgZG9uJ3QgdXNlIGl0LCBzaW5jZSBpdCByZWxpZXMgb24gdGhlIERhdGUgY29uc3RydWN0b3IsIHdoaWNoXFxuXCIgK1xyXG5cdFx0XHRcdFx0XHRcdFwiYmVoYXZlcyB2ZXJ5IGRpZmZlcmVudGx5IGFjcm9zcyBicm93c2VycyBhbmQgbG9jYWxlcy4gVXNlIGBkYXRlSVNPYFxcblwiICtcclxuXHRcdFx0XHRcdFx0XHRcImluc3RlYWQgb3Igb25lIG9mIHRoZSBsb2NhbGUgc3BlY2lmaWMgbWV0aG9kcyBpbiBgbG9jYWxpemF0aW9ucy9gXFxuXCIgK1xyXG5cdFx0XHRcdFx0XHRcdFwiYW5kIGBhZGRpdGlvbmFsLW1ldGhvZHMuanNgLlwiXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8ICEvSW52YWxpZHxOYU4vLnRlc3QoIG5ldyBEYXRlKCB2YWx1ZSApLnRvU3RyaW5nKCkgKTtcclxuXHRcdFx0fTtcclxuXHRcdH0oKSApLFxyXG5cclxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvZGF0ZUlTTy1tZXRob2QvXHJcblx0XHRkYXRlSVNPOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15cXGR7NH1bXFwvXFwtXSgwP1sxLTldfDFbMDEyXSlbXFwvXFwtXSgwP1sxLTldfFsxMl1bMC05XXwzWzAxXSkkLy50ZXN0KCB2YWx1ZSApO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL251bWJlci1tZXRob2QvXHJcblx0XHRudW1iZXI6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAvXig/Oi0/XFxkK3wtP1xcZHsxLDN9KD86LFxcZHszfSkrKT8oPzpcXC5cXGQrKT8kLy50ZXN0KCB2YWx1ZSApO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2RpZ2l0cy1tZXRob2QvXHJcblx0XHRkaWdpdHM6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAvXlxcZCskLy50ZXN0KCB2YWx1ZSApO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21pbmxlbmd0aC1tZXRob2QvXHJcblx0XHRtaW5sZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XHJcblx0XHRcdHZhciBsZW5ndGggPSBBcnJheS5pc0FycmF5KCB2YWx1ZSApID8gdmFsdWUubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoIHZhbHVlLCBlbGVtZW50ICk7XHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgbGVuZ3RoID49IHBhcmFtO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21heGxlbmd0aC1tZXRob2QvXHJcblx0XHRtYXhsZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XHJcblx0XHRcdHZhciBsZW5ndGggPSBBcnJheS5pc0FycmF5KCB2YWx1ZSApID8gdmFsdWUubGVuZ3RoIDogdGhpcy5nZXRMZW5ndGgoIHZhbHVlLCBlbGVtZW50ICk7XHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgbGVuZ3RoIDw9IHBhcmFtO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3JhbmdlbGVuZ3RoLW1ldGhvZC9cclxuXHRcdHJhbmdlbGVuZ3RoOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xyXG5cdFx0XHR2YXIgbGVuZ3RoID0gQXJyYXkuaXNBcnJheSggdmFsdWUgKSA/IHZhbHVlLmxlbmd0aCA6IHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApO1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8ICggbGVuZ3RoID49IHBhcmFtWyAwIF0gJiYgbGVuZ3RoIDw9IHBhcmFtWyAxIF0gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9taW4tbWV0aG9kL1xyXG5cdFx0bWluOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IHZhbHVlID49IHBhcmFtO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21heC1tZXRob2QvXHJcblx0XHRtYXg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgdmFsdWUgPD0gcGFyYW07XHJcblx0XHR9LFxyXG5cclxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvcmFuZ2UtbWV0aG9kL1xyXG5cdFx0cmFuZ2U6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgKCB2YWx1ZSA+PSBwYXJhbVsgMCBdICYmIHZhbHVlIDw9IHBhcmFtWyAxIF0gKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9zdGVwLW1ldGhvZC9cclxuXHRcdHN0ZXA6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XHJcblx0XHRcdHZhciB0eXBlID0gJCggZWxlbWVudCApLmF0dHIoIFwidHlwZVwiICksXHJcblx0XHRcdFx0ZXJyb3JNZXNzYWdlID0gXCJTdGVwIGF0dHJpYnV0ZSBvbiBpbnB1dCB0eXBlIFwiICsgdHlwZSArIFwiIGlzIG5vdCBzdXBwb3J0ZWQuXCIsXHJcblx0XHRcdFx0c3VwcG9ydGVkVHlwZXMgPSBbIFwidGV4dFwiLCBcIm51bWJlclwiLCBcInJhbmdlXCIgXSxcclxuXHRcdFx0XHRyZSA9IG5ldyBSZWdFeHAoIFwiXFxcXGJcIiArIHR5cGUgKyBcIlxcXFxiXCIgKSxcclxuXHRcdFx0XHRub3RTdXBwb3J0ZWQgPSB0eXBlICYmICFyZS50ZXN0KCBzdXBwb3J0ZWRUeXBlcy5qb2luKCkgKSxcclxuXHRcdFx0XHRkZWNpbWFsUGxhY2VzID0gZnVuY3Rpb24oIG51bSApIHtcclxuXHRcdFx0XHRcdHZhciBtYXRjaCA9ICggXCJcIiArIG51bSApLm1hdGNoKCAvKD86XFwuKFxcZCspKT8kLyApO1xyXG5cdFx0XHRcdFx0aWYgKCAhbWF0Y2ggKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiAwO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdC8vIE51bWJlciBvZiBkaWdpdHMgcmlnaHQgb2YgZGVjaW1hbCBwb2ludC5cclxuXHRcdFx0XHRcdHJldHVybiBtYXRjaFsgMSBdID8gbWF0Y2hbIDEgXS5sZW5ndGggOiAwO1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0dG9JbnQgPSBmdW5jdGlvbiggbnVtICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIG51bSAqIE1hdGgucG93KCAxMCwgZGVjaW1hbHMgKSApO1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0dmFsaWQgPSB0cnVlLFxyXG5cdFx0XHRcdGRlY2ltYWxzO1xyXG5cclxuXHRcdFx0Ly8gV29ya3Mgb25seSBmb3IgdGV4dCwgbnVtYmVyIGFuZCByYW5nZSBpbnB1dCB0eXBlc1xyXG5cdFx0XHQvLyBUT0RPIGZpbmQgYSB3YXkgdG8gc3VwcG9ydCBpbnB1dCB0eXBlcyBkYXRlLCBkYXRldGltZSwgZGF0ZXRpbWUtbG9jYWwsIG1vbnRoLCB0aW1lIGFuZCB3ZWVrXHJcblx0XHRcdGlmICggbm90U3VwcG9ydGVkICkge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciggZXJyb3JNZXNzYWdlICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGRlY2ltYWxzID0gZGVjaW1hbFBsYWNlcyggcGFyYW0gKTtcclxuXHJcblx0XHRcdC8vIFZhbHVlIGNhbid0IGhhdmUgdG9vIG1hbnkgZGVjaW1hbHNcclxuXHRcdFx0aWYgKCBkZWNpbWFsUGxhY2VzKCB2YWx1ZSApID4gZGVjaW1hbHMgfHwgdG9JbnQoIHZhbHVlICkgJSB0b0ludCggcGFyYW0gKSAhPT0gMCApIHtcclxuXHRcdFx0XHR2YWxpZCA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IHZhbGlkO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2VxdWFsVG8tbWV0aG9kL1xyXG5cdFx0ZXF1YWxUbzogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcclxuXHJcblx0XHRcdC8vIEJpbmQgdG8gdGhlIGJsdXIgZXZlbnQgb2YgdGhlIHRhcmdldCBpbiBvcmRlciB0byByZXZhbGlkYXRlIHdoZW5ldmVyIHRoZSB0YXJnZXQgZmllbGQgaXMgdXBkYXRlZFxyXG5cdFx0XHR2YXIgdGFyZ2V0ID0gJCggcGFyYW0gKTtcclxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLm9uZm9jdXNvdXQgJiYgdGFyZ2V0Lm5vdCggXCIudmFsaWRhdGUtZXF1YWxUby1ibHVyXCIgKS5sZW5ndGggKSB7XHJcblx0XHRcdFx0dGFyZ2V0LmFkZENsYXNzKCBcInZhbGlkYXRlLWVxdWFsVG8tYmx1clwiICkub24oIFwiYmx1ci52YWxpZGF0ZS1lcXVhbFRvXCIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0JCggZWxlbWVudCApLnZhbGlkKCk7XHJcblx0XHRcdFx0fSApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB2YWx1ZSA9PT0gdGFyZ2V0LnZhbCgpO1xyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3JlbW90ZS1tZXRob2QvXHJcblx0XHRyZW1vdGU6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0sIG1ldGhvZCApIHtcclxuXHRcdFx0aWYgKCB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgKSB7XHJcblx0XHRcdFx0cmV0dXJuIFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtZXRob2QgPSB0eXBlb2YgbWV0aG9kID09PSBcInN0cmluZ1wiICYmIG1ldGhvZCB8fCBcInJlbW90ZVwiO1xyXG5cclxuXHRcdFx0dmFyIHByZXZpb3VzID0gdGhpcy5wcmV2aW91c1ZhbHVlKCBlbGVtZW50LCBtZXRob2QgKSxcclxuXHRcdFx0XHR2YWxpZGF0b3IsIGRhdGEsIG9wdGlvbkRhdGFTdHJpbmc7XHJcblxyXG5cdFx0XHRpZiAoICF0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSApIHtcclxuXHRcdFx0XHR0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSA9IHt9O1xyXG5cdFx0XHR9XHJcblx0XHRcdHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZSA9IHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZSB8fCB0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF07XHJcblx0XHRcdHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdWyBtZXRob2QgXSA9IHByZXZpb3VzLm1lc3NhZ2U7XHJcblxyXG5cdFx0XHRwYXJhbSA9IHR5cGVvZiBwYXJhbSA9PT0gXCJzdHJpbmdcIiAmJiB7IHVybDogcGFyYW0gfSB8fCBwYXJhbTtcclxuXHRcdFx0b3B0aW9uRGF0YVN0cmluZyA9ICQucGFyYW0oICQuZXh0ZW5kKCB7IGRhdGE6IHZhbHVlIH0sIHBhcmFtLmRhdGEgKSApO1xyXG5cdFx0XHRpZiAoIHByZXZpb3VzLm9sZCA9PT0gb3B0aW9uRGF0YVN0cmluZyApIHtcclxuXHRcdFx0XHRyZXR1cm4gcHJldmlvdXMudmFsaWQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHByZXZpb3VzLm9sZCA9IG9wdGlvbkRhdGFTdHJpbmc7XHJcblx0XHRcdHZhbGlkYXRvciA9IHRoaXM7XHJcblx0XHRcdHRoaXMuc3RhcnRSZXF1ZXN0KCBlbGVtZW50ICk7XHJcblx0XHRcdGRhdGEgPSB7fTtcclxuXHRcdFx0ZGF0YVsgZWxlbWVudC5uYW1lIF0gPSB2YWx1ZTtcclxuXHRcdFx0JC5hamF4KCAkLmV4dGVuZCggdHJ1ZSwge1xyXG5cdFx0XHRcdG1vZGU6IFwiYWJvcnRcIixcclxuXHRcdFx0XHRwb3J0OiBcInZhbGlkYXRlXCIgKyBlbGVtZW50Lm5hbWUsXHJcblx0XHRcdFx0ZGF0YVR5cGU6IFwianNvblwiLFxyXG5cdFx0XHRcdGRhdGE6IGRhdGEsXHJcblx0XHRcdFx0Y29udGV4dDogdmFsaWRhdG9yLmN1cnJlbnRGb3JtLFxyXG5cdFx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuXHRcdFx0XHRcdHZhciB2YWxpZCA9IHJlc3BvbnNlID09PSB0cnVlIHx8IHJlc3BvbnNlID09PSBcInRydWVcIixcclxuXHRcdFx0XHRcdFx0ZXJyb3JzLCBtZXNzYWdlLCBzdWJtaXR0ZWQ7XHJcblxyXG5cdFx0XHRcdFx0dmFsaWRhdG9yLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF0gPSBwcmV2aW91cy5vcmlnaW5hbE1lc3NhZ2U7XHJcblx0XHRcdFx0XHRpZiAoIHZhbGlkICkge1xyXG5cdFx0XHRcdFx0XHRzdWJtaXR0ZWQgPSB2YWxpZGF0b3IuZm9ybVN1Ym1pdHRlZDtcclxuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLnJlc2V0SW50ZXJuYWxzKCk7XHJcblx0XHRcdFx0XHRcdHZhbGlkYXRvci50b0hpZGUgPSB2YWxpZGF0b3IuZXJyb3JzRm9yKCBlbGVtZW50ICk7XHJcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5mb3JtU3VibWl0dGVkID0gc3VibWl0dGVkO1xyXG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc3VjY2Vzc0xpc3QucHVzaCggZWxlbWVudCApO1xyXG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IuaW52YWxpZFsgZWxlbWVudC5uYW1lIF0gPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLnNob3dFcnJvcnMoKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGVycm9ycyA9IHt9O1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlID0gcmVzcG9uc2UgfHwgdmFsaWRhdG9yLmRlZmF1bHRNZXNzYWdlKCBlbGVtZW50LCB7IG1ldGhvZDogbWV0aG9kLCBwYXJhbWV0ZXJzOiB2YWx1ZSB9ICk7XHJcblx0XHRcdFx0XHRcdGVycm9yc1sgZWxlbWVudC5uYW1lIF0gPSBwcmV2aW91cy5tZXNzYWdlID0gbWVzc2FnZTtcclxuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmludmFsaWRbIGVsZW1lbnQubmFtZSBdID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLnNob3dFcnJvcnMoIGVycm9ycyApO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cHJldmlvdXMudmFsaWQgPSB2YWxpZDtcclxuXHRcdFx0XHRcdHZhbGlkYXRvci5zdG9wUmVxdWVzdCggZWxlbWVudCwgdmFsaWQgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sIHBhcmFtICkgKTtcclxuXHRcdFx0cmV0dXJuIFwicGVuZGluZ1wiO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0gKTtcclxuXHJcbi8vIEFqYXggbW9kZTogYWJvcnRcclxuLy8gdXNhZ2U6ICQuYWpheCh7IG1vZGU6IFwiYWJvcnRcIlssIHBvcnQ6IFwidW5pcXVlcG9ydFwiXX0pO1xyXG4vLyBpZiBtb2RlOlwiYWJvcnRcIiBpcyB1c2VkLCB0aGUgcHJldmlvdXMgcmVxdWVzdCBvbiB0aGF0IHBvcnQgKHBvcnQgY2FuIGJlIHVuZGVmaW5lZCkgaXMgYWJvcnRlZCB2aWEgWE1MSHR0cFJlcXVlc3QuYWJvcnQoKVxyXG5cclxudmFyIHBlbmRpbmdSZXF1ZXN0cyA9IHt9LFxyXG5cdGFqYXg7XHJcblxyXG4vLyBVc2UgYSBwcmVmaWx0ZXIgaWYgYXZhaWxhYmxlICgxLjUrKVxyXG5pZiAoICQuYWpheFByZWZpbHRlciApIHtcclxuXHQkLmFqYXhQcmVmaWx0ZXIoIGZ1bmN0aW9uKCBzZXR0aW5ncywgXywgeGhyICkge1xyXG5cdFx0dmFyIHBvcnQgPSBzZXR0aW5ncy5wb3J0O1xyXG5cdFx0aWYgKCBzZXR0aW5ncy5tb2RlID09PSBcImFib3J0XCIgKSB7XHJcblx0XHRcdGlmICggcGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0gKSB7XHJcblx0XHRcdFx0cGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0uYWJvcnQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXSA9IHhocjtcclxuXHRcdH1cclxuXHR9ICk7XHJcbn0gZWxzZSB7XHJcblxyXG5cdC8vIFByb3h5IGFqYXhcclxuXHRhamF4ID0gJC5hamF4O1xyXG5cdCQuYWpheCA9IGZ1bmN0aW9uKCBzZXR0aW5ncyApIHtcclxuXHRcdHZhciBtb2RlID0gKCBcIm1vZGVcIiBpbiBzZXR0aW5ncyA/IHNldHRpbmdzIDogJC5hamF4U2V0dGluZ3MgKS5tb2RlLFxyXG5cdFx0XHRwb3J0ID0gKCBcInBvcnRcIiBpbiBzZXR0aW5ncyA/IHNldHRpbmdzIDogJC5hamF4U2V0dGluZ3MgKS5wb3J0O1xyXG5cdFx0aWYgKCBtb2RlID09PSBcImFib3J0XCIgKSB7XHJcblx0XHRcdGlmICggcGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0gKSB7XHJcblx0XHRcdFx0cGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0uYWJvcnQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXSA9IGFqYXguYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xyXG5cdFx0XHRyZXR1cm4gcGVuZGluZ1JlcXVlc3RzWyBwb3J0IF07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gYWpheC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcblx0fTtcclxufVxyXG5yZXR1cm4gJDtcclxufSkpO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAkKFwiLmpzLWltZ1wiKS5hZGRDbGFzcyhcIi0tYWN0aXZlXCIpO1xyXG59KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgJChcIi5qcy1idXR0b25cIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKFwiLS1oaWRkZW5cIik7XHJcbiAgICAkKHRoaXMpLnNpYmxpbmdzKFwiYVwiKS50b2dnbGVDbGFzcyhcIi0taGlkZGVuXCIpO1xyXG4gICAgJCh0aGlzKS5wYXJlbnQoXCJkaXZcIikucHJldihcImRpdlwiKS50b2dnbGVDbGFzcyhcIi0tb3BlbmVkXCIpO1xyXG4gIH0pO1xyXG59KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgJChcIi5qcy10aHVtYlwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGxldCBtYWluSW1hZ2UgPSAkKHRoaXMpLmluZGV4KCk7XHJcbiAgICAkKFwiLmpzLXRodW1iXCIpLnJlbW92ZUNsYXNzKFwiLS1hY3RpdmVcIik7XHJcbiAgICAkKHRoaXMpLmFkZENsYXNzKFwiLS1hY3RpdmVcIik7XHJcbiAgICAkKFwiLmpzLW1haW5cIikucmVtb3ZlQ2xhc3MoXCItLWFjdGl2ZVwiKTtcclxuICAgICQoXCIuanMtbWFpblwiKS5lcShtYWluSW1hZ2UpLmFkZENsYXNzKFwiLS1hY3RpdmVcIik7XHJcbiAgfSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAkKFwiLmpzLXRyaWdnZXJcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgJChcIi5qcy10cmlnZ2VyXCIpLnJlbW92ZUNsYXNzKFwiLS1hY3RpdmVcIik7XHJcbiAgICAkKFwiLmpzLXRhYlwiKS5yZW1vdmVDbGFzcyhcIi0tYWN0aXZlXCIpO1xyXG4gICAgJCh0aGlzKS5hZGRDbGFzcyhcIi0tYWN0aXZlXCIpO1xyXG4gICAgJCgkKHRoaXMpLmF0dHIoXCJocmVmXCIpKS5hZGRDbGFzcyhcIi0tYWN0aXZlXCIpO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCAkdGFibGV0U2NyZWVuID0gOTkwO1xyXG4gIC8vINC10YHQu9C4INGN0LrRgNCw0L0gPCA5OTAsINC00LXQu9Cw0LXRgiDQsNC60YLQuNCy0L3Ri9C8INCy0YLQvtGA0L7QuSDRgtCw0LEsINGC0LDQuiDQutCw0Log0L/QtdGA0LLRi9C5INGB0LrRgNGL0YJcclxuICBpZiAoJCh3aW5kb3cpLndpZHRoKCkgPCAkdGFibGV0U2NyZWVuKSB7XHJcbiAgICAkKFwiLmpzLXRyaWdnZXJzXCIpLmNoaWxkcmVuKFwiLmpzLXRyaWdnZXJcIilbMV0uY2xpY2soKTtcclxuICB9IGVsc2Uge1xyXG4gICAgJChcIi5qcy10cmlnZ2VyOmZpcnN0XCIpLmNsaWNrKCk7XHJcbiAgfVxyXG4gIC8vINC00LXQu9Cw0LXRgiDQsNC60YLQuNCy0L3Ri9C8INCy0YLQvtGA0L7QuSDRgtCw0LEg0L/RgNC4INGD0LzQtdC90YzRiNC10L3QuNC4INC+0LrQvdCwLCDQuCDQv9C10YDQstGL0LkgLSDQv9GA0Lgg0YPQstC10LvQuNGH0LXQvdC40LhcclxuICAkKHdpbmRvdykub24oXCJyZXNpemVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKCQod2luZG93KS53aWR0aCgpIDwgJHRhYmxldFNjcmVlbikge1xyXG4gICAgICAkKFwiLmpzLXRyaWdnZXJzXCIpLmNoaWxkcmVuKFwiLmpzLXRyaWdnZXJcIilbMV0uY2xpY2soKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICQoXCIuanMtdHJpZ2dlcjpmaXJzdFwiKS5jbGljaygpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59KTtcclxuY29uc3Qgc2xpZGVyID0gbmV3IFN3aXBlcihcIi5qcy1zd2lwZXJcIiwge1xyXG4gIHNsaWRlc1BlclZpZXc6IDEsXHJcbiAgc3BhY2VCZXR3ZWVuOiAxMCxcclxuICBzcGVlZDogMTAwMCxcclxuICBwYWdpbmF0aW9uOiB7XHJcbiAgICBlbDogXCIuc3BlY2lhbHNfX3BhZ2luYXRpb25cIixcclxuICAgIGNsaWNrYWJsZTogdHJ1ZSxcclxuICB9LFxyXG4gIGJyZWFrcG9pbnRzOiB7XHJcbiAgICA1NjA6IHtcclxuICAgICAgc2xpZGVzUGVyVmlldzogMixcclxuICAgICAgc3BhY2VCZXR3ZWVuOiAyMCxcclxuICAgIH0sXHJcbiAgICA5OTA6IHtcclxuICAgICAgc2xpZGVzUGVyVmlldzogMyxcclxuICAgICAgc3BhY2VCZXR3ZWVuOiAyMCxcclxuICAgIH0sXHJcbiAgICAxMjAwOiB7XHJcbiAgICAgIHNsaWRlc1BlclZpZXc6IDQsXHJcbiAgICAgIHNwYWNlQmV0d2VlbjogMzAsXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG5cclxuY29uc3Qgc2xpZGVyMiA9IG5ldyBTd2lwZXIoXCIuanMtc3dpcGVyLTJcIiwge1xyXG4gIHNsaWRlc1BlclZpZXc6IDIsXHJcbiAgc3BhY2VCZXR3ZWVuOiAyMCxcclxuICBzcGVlZDogMTAwMCxcclxuICBuYXZpZ2F0aW9uOiB7XHJcbiAgICBuZXh0RWw6IFwiLnN3aXBlci1idXR0b24tbmV4dFwiLFxyXG4gICAgcHJldkVsOiBcIi5zd2lwZXItYnV0dG9uLXByZXZcIixcclxuICB9LFxyXG4gIHBhZ2luYXRpb246IHtcclxuICAgIGVsOiBcIi55b3VsaWtlX19wYWdpbmF0aW9uXCIsXHJcbiAgICBjbGlja2FibGU6IHRydWUsXHJcbiAgfSxcclxuICBicmVha3BvaW50czoge1xyXG4gICAgNTYwOiB7XHJcbiAgICAgIHNsaWRlc1BlclZpZXc6IDIsXHJcbiAgICAgIHNwYWNlQmV0d2VlbjogMjAsXHJcbiAgICB9LFxyXG4gICAgOTkwOiB7XHJcbiAgICAgIHNsaWRlc1BlclZpZXc6IDMsXHJcbiAgICAgIHNwYWNlQmV0d2VlbjogMjAsXHJcbiAgICB9LFxyXG4gICAgMTIwMDoge1xyXG4gICAgICBzbGlkZXNQZXJWaWV3OiA0LFxyXG4gICAgICBzcGFjZUJldHdlZW46IDksXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAkKFwiLmpzLWJ1cmdlci1pY29uXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgJChcImJvZHlcIikudG9nZ2xlQ2xhc3MoXCItLWxvY2tcIik7XHJcbiAgICAkKCQodGhpcykpLnRvZ2dsZUNsYXNzKFwiLS1hY3RpdmVcIik7XHJcbiAgICAkKFwiLmpzLWJ1cmdlci1tZW51XCIpLnRvZ2dsZUNsYXNzKFwiLS1hY3RpdmVcIik7XHJcbiAgfSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAkKFwiLmpzLWFjY29yZGlvbi1zd2l0Y2hcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKHRoaXMpLm5leHQoXCIuanMtYWNjb3JkaW9uLWxpc3RcIikuc2xpZGVUb2dnbGUoKTtcclxuICAgICQodGhpcykuY2hpbGRyZW4oXCJpbWdcIikudG9nZ2xlQ2xhc3MoXCItLWFjdGl2ZVwiKTtcclxuICB9KTtcclxufSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG4gICQoXCIuanMtZmFuY3lib3hcIikuZmFuY3lib3goe1xyXG4gICAgdG91Y2g6IGZhbHNlLFxyXG4gICAgbW9kYWw6IHRydWUsXHJcbiAgfSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAkKFwiI2pzLWZvcm1cIikudmFsaWRhdGUoe1xyXG4gICAgcnVsZXM6IHtcclxuICAgICAgbmFtZToge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICB0ZWw6IHtcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBudW1iZXJWYWxpZGF0aW9uOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9KTtcclxuICAkLnZhbGlkYXRvci5hZGRNZXRob2QoXHJcbiAgICBcIm51bWJlclZhbGlkYXRpb25cIixcclxuICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gL15cXCg/KFswLTldezN9KVxcKT9bLS4gXT8oWzAtOV17M30pWy0uIF0/KFswLTldezR9KSQvLnRlc3QodmFsdWUpO1xyXG4gICAgfSxcclxuICAgIFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgbnVtYmVyLCBzdGFydGluZyBmcm9tICs3IG9yIDhcIlxyXG4gICk7XHJcbn0pOyJdfQ==
