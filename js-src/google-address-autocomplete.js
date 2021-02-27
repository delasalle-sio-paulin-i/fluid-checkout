/**
 * Manage the Google Address suggestions and autocomplete address fields
 */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.GoogleAddressAutocomplete = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;

	var _hasJQuery = ( $ != null );
	var _hasInitialized = false;
	var _publicMethods = { };
	var _settings = {
		bodyClass: 'has-google-autocomplete',

		autocompleteInputSelector: '#address_1, #shipping_address_1, #billing_address_1',
		addressGroupSelector: '.woocommerce-shipping-fields, .woocommerce-billing-fields', // TODO: add group selector for address in account pages
		select2Selector: '[class*="select2"]',
		addressFieldsSelector: 'input, select, textarea',
		addressFieldsDontCleanSelector: '[name$="_address_id"], #shipping_address_save, #billing_address_save',
		
		autocompleteDefaultOptions: {
			fields: [ 'address_components' ],
			types: [ 'address' ],
		},
		
		componentRestrictions: {},
		
		// Keys based on component names from Google Place data
		componentValueType: {
			street_number: 'short_name',
			route: 'long_name',
			locality: 'long_name',
			administrative_area_level_1: 'short_name',
			administrative_area_level_2: 'long_name',
			country: 'short_name',
			postal_code: 'short_name',
		},
		
		// TODO: Need to set different address_components combination for each country, similar to WC locales
		// Keys based on WooCommerce forms field ids, values based on component names froom Google Place data
		localeComponents: {
			default: {
				country: 'country',
				postcode: 'postal_code',
				state: 'administrative_area_level_1',
				city: 'locality',
				address_1: [ 'street_number', 'route' ],
				components_separator: ' ',
			},
			BR: {
				city: 'administrative_area_level_2',
				address_1: [ 'route', 'street_number' ],
				components_separator: ', ',
			}
		},

	};
	var _updateCheckout = true;


	/**
	 * METHODS
	 */



	/*!
	* Merge two or more objects together.
	* (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
	* @param   {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
	* @param   {Object}   objects  The objects to merge together
	* @returns {Object}            Merged values of defaults and options
	*/
	var extend = function () {
		// Variables
		var extended = {};
		var deep = false;
		var i = 0;

		// Check if a deep merge
		if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
			deep = arguments[0];
			i++;
		}

		// Merge the object into the extended object
		var merge = function (obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					// If property is an object, merge properties
					if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
						extended[prop] = extend(extended[prop], obj[prop]);
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};

		// Loop through each object and conduct a merge
		for (; i < arguments.length; i++) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;
    };



	/**
	 * Set address field value.
	 *
	 * @param   {HTMLElement}    field  Form field.
	 * @param   {Object}         value  Value to set for the form field.
	 */
	var setFieldValue = function( field, value ) {
		// Bail if field not provided
		if ( ! field ) { return; }
		
		// Sanitize value
		value = value == undefined || value == null ? '' : value;

		// Set field value
		field.value = value;

		// Set field value for select2 fields
		if ( _hasJQuery && field.matches( _settings.select2Selector ) ) {
			$( field ).val( value );
			$( field ).select2().trigger( 'change' );
		}

		// Clear validation status
		if ( window.CheckoutValidation ) {
			CheckoutValidation.clearValidationResults( field, field.closest( _settings.formRowSelector ) );
		}
	}



	/**
	 * Clear address form fields
	 * 
	 * @param   {HTMLElement}    groupElement  Element containing the address form field.
	 */
	var cleanAddressFields = function( groupElement ) {
		// Bail if address book element not passed
		if ( ! groupElement ) { return; }

		_updateCheckout = false;

		var fields = groupElement.querySelectorAll( _settings.addressFieldsSelector );
		for ( var i = 0; i < fields.length; i++ ) {
			var field = fields[i];
			
			// Skip address id fields
			if ( ! field.matches( _settings.addressFieldsDontCleanSelector ) ) {
				setFieldValue( field, '' );
			}
		}
		
		_updateCheckout = true;
	}



	var getLocale = function( countryCode ) {
		var locale = _settings.localeComponents.default;

		// Get full locale settings for the country
		if ( countryCode != null && _settings.localeComponents.hasOwnProperty( countryCode.toUpperCase() ) ) {
			locale = extend( locale, _settings.localeComponents[ countryCode.toUpperCase() ] );
		}

		return locale;
	}



	/**
	 * Get the value for an address field from the Google Place data based on the locale.
	 *
	 * @param   {string}  fieldId  Form field id to get data for.
	 * @param   {Object}  place    Google Place data
	 * @param	{string}  locale   Country code of the locale.
	 *
	 * @return  {string}           Localized value for the form field.
	 */
	var getFieldValueFromPlace = function( fieldId, place, locale ) {
		
		// Bail if place does not have address components
		if ( ! place || ! place.address_components ) { return; }

		var values = [];
		
		// Get default locale if not passed in
		if ( ! locale ) {
			locale = _settings.localeComponents.default;
		}
		
		// Get `fieldComponents` as an Array
		var fieldComponents = locale[ fieldId ];
		if ( ! Array.isArray( fieldComponents ) ) { fieldComponents = [ fieldComponents ]; }
		
		
		place.address_components.forEach( function( component ) {
			var fieldType = component.types[0];
			
			if ( fieldComponents.includes( fieldType ) ) {
				var fieldValue = component[ _settings.componentValueType[ fieldType ] ];
				values.push( fieldValue );
			}
			
		} );

		// TODO: Get correct field components order based on locale, such as "number + street" vs "street + number"
		
		return values.join( locale.components_separator );
	}



	/**
	 * Fill address form field values for a place from Google Place API.
	 *
	 * @param   {Object}                           place         Google Place data.
	 * @param   {HTMLElement}                      input         Address lookup for field element.
	 * @param   {google.maps.places.Autocomplete}  autocomplete  Google Maps Autocomplete object.
	 */
	var fillAddressFields = function( place, input, autocomplete ) {
		
		var groupElement = input.closest( _settings.addressGroupSelector );
		
		cleanAddressFields( groupElement );
		
		// Set country field
		var countryValue = getFieldValueFromPlace( 'country', place );
		var countryField = groupElement.querySelector( '[id$="country"]' );
		setFieldValue( countryField, countryValue );

		// Bail and clean fields if country not allowed
		if ( countryField.value !== countryValue ) {
			// TODO: Display message telling user the country is not available
			cleanAddressFields( groupElement );
			return;
		}

		// Set other fields
		var locale = getLocale( countryValue );
		var fieldIds = Object.getOwnPropertyNames( locale );
		for ( var i = 0; i < fieldIds.length; i++ ) {
			var fieldId = fieldIds[ i ];
			
			// Skip country field
			if ( fieldId == 'country' ) { continue; }

			// Set field value
			var value = getFieldValueFromPlace( fieldId, place, locale );
			var field = groupElement.querySelector( '[id$="'+fieldId+'"]' );
			setFieldValue( field, value );
		}
	}



	/**
	 * Initialize Google Address Autocomplete for an address lookup field.
	 *
	 * @param   {HTMLElement}  input  Address lookup for field element.
	 */
	var initField = function( input ) {
		// Maybe set country restrictions
		if ( _settings.componentRestrictions.hasOwnProperty( input.id ) ) {
			var inputComponentsRestrictions = _settings.componentRestrictions[ input.id ];
			_settings.autocompleteDefaultOptions.componentRestrictions = inputComponentsRestrictions;
		}
		
		var autocomplete = new google.maps.places.Autocomplete( input, _settings.autocompleteDefaultOptions );
		var onPlaceChange = function() {
			var place = autocomplete.getPlace();
	
			// Check if user selected an address
			if ( place.address_components ) {
				fillAddressFields( place, input, autocomplete );
			}
		}
		autocomplete.addListener( 'place_changed', onPlaceChange );
	}


	/**
	 * Initialize Google Address Autocomplete for all address lookup fields.
	 */
	var initFields = function() {
		var inputs = document.querySelectorAll( _settings.autocompleteInputSelector );
		inputs.forEach( initField );
	}
	

	/**
	 * Initialize component and set related handlers.
	 * 
	 * @param   {Object}   options  Pass different settings values for initializing this component.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		_settings = extend( true, _settings, options );
		
		initFields();
		// TODO: Initialize fields after updated_checkout event to re-initialize address complete on billing field because the content element is replaced entirely

		// Finish initialization
		document.body.classList.add( _settings.bodyClass );
		_hasInitialized = true;
	};


	
	//
	// Public APIs
	//
	return _publicMethods;

});
