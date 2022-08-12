/**
 * Manage checkout steps state.
 *
 * DEPENDS ON:
 * - jQuery // Interact with WooCommerce events
 */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.CheckoutCoupons = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	var $ = jQuery;
	var _hasJQuery = ( $ != null );

	var _hasInitialized = false;
	var _publicMethods = {};
	var _settings = {
		bodyClass: 'has-fc-checkout-coupons',

		uiProcessingClass: 'processing',

		sectionWrapperSelector: '.fc-step__substep',
		generalNoticesSelector: '.woocommerce-notices-wrapper',
		messagesWrapperSelector: '.fc-coupon-code-messages',
		suppressSuccessMessages: 'no',

		couponAddedSectionSelector: '.fc-step__substep-text-content--coupon-codes',
		couponFieldSelector: 'input[name="coupon_code"]',
		addCouponButtonSelector: '.fc-coupon-code__apply',
		removeCouponButtonSelector: '.woocommerce-remove-coupon',
		
		couponCodeAttribute: 'data-coupon',
		referenceIdAttribute: 'data-reference-id',
		expansibleCouponSectionKeyAttribute: 'data-section-key',

		expansibleCouponToggleSelector: '.fc-expansible-form-section__toggle',
		expansibleCouponContentSelector: '.fc-expansible-form-section__content',
		expansibleCouponToggleButtonSelector: '.expansible-section__toggle-plus',

	}
	var _key = {
		ENTER: 'Enter',
		SPACE: ' ',
	}



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
	 * Add notices in the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var showNotices = function( content, referenceElement ) {
		// Maybe get specific messages wrapper
		var messagesWrapper;
		var sectionWrapper = referenceElement ? referenceElement.closest( _settings.sectionWrapperSelector ) : null;
		if ( sectionWrapper ) {
			messagesWrapper = sectionWrapper.querySelector( _settings.messagesWrapperSelector );
		}
		else {
			messagesWrapper = document.querySelector( _settings.generalNoticesSelector );
		}
		
		// Add message
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = content;
		}
	}

	/**
	 * Remove all notices from the coupon code section.
	 *
	 * @param   HTML  content  HTML content to be displayed.
	 */
	var clearNotices = function() {
		var generalNotices = document.querySelector( _settings.generalNoticesSelector );
		if ( generalNotices ) {
			generalNotices.innerHTML = '';
		}

		var messagesWrapper = document.querySelector( _settings.messagesWrapperSelector );
		if ( messagesWrapper ) {
			messagesWrapper.innerHTML = '';
		}
	}



	/**
	 * Process adding a coupon code to the cart from the add coupon button.
	 *
	 * @param   HTMLElement  referenceElement  The element which was used to trigger adding the coupon.
	 */
	var processAddCoupon = function( referenceElement ) {
		var couponCode = '';

		// Try to get coupon code from attributes
		if ( referenceElement && referenceElement.hasAttribute( _settings.couponCodeAttribute ) ) {
			couponCode = referenceElement.getAttribute( _settings.couponCodeAttribute );
		}

		// Try to get coupon code from coupon field
		if ( ! couponCode || '' == couponCode ) {
			var couponSection = referenceElement.closest( '.fc-coupon-code-section' );
			var couponField = couponSection.querySelector( _settings.couponFieldSelector );

			// Bail if coupon code field was not found
			if ( ! couponField ) { return; }

			// Focus on add coupon button and bail if coupon field is empty
			if ( '' === couponField.value.trim() ) {
				couponField.value = ''; // Clear space chars if any
				couponField.focus();
				return;
			}

			couponCode = couponField.value;
		}

		// Bail if coupon code was not provided
		if ( ! couponCode || '' == couponCode ) { return; }

		_publicMethods.addCouponCode( couponCode, referenceElement );
	}
	
	/**
	 * Process removing a coupon code to the cart from the add coupon button.
	 *
	 * @param   HTMLElement  referenceElement  The remove coupon button element.
	 */
	var processRemoveCoupon = function( referenceElement ) {
		// Bail if add coupon button not provided
		if ( ! referenceElement ) { return; }

		var couponCode = '';

		// Try to get coupon code from button attributes
		if ( referenceElement.hasAttribute( _settings.couponCodeAttribute ) ) {
			couponCode = referenceElement.getAttribute( _settings.couponCodeAttribute );
		}

		// Bail if coupon code was not provided
		if ( ! couponCode || '' == couponCode ) { return; }

		_publicMethods.removeCouponCode( couponCode, referenceElement );
	}



	/**
	 * Handle document clicks and route to the appropriate function.
	 */
	var handleClick = function( e ) {
		
		// ADD COUPON
		if ( e.target.closest( _settings.addCouponButtonSelector ) ) {
			e.preventDefault();
			var addCouponButton = e.target.closest( _settings.addCouponButtonSelector );
			processAddCoupon( addCouponButton );
		}
		// REMOVE COUPON
		else if ( e.target.closest( _settings.removeCouponButtonSelector ) ) {
			e.preventDefault();
			var removeCouponButton = e.target.closest( _settings.removeCouponButtonSelector );
			processRemoveCoupon( removeCouponButton );
		}
		
	};

	/**
	 * Handle keypress event.
	 */
	 var handleKeyDown = function( e ) {
		// Should do nothing if the default action has been cancelled
		if ( e.defaultPrevented ) { return; }

		// ENTER on input fields
		if ( e.key == _key.ENTER && e.target.closest( _settings.couponFieldSelector ) ) {
			// Prevents submitting form
			e.preventDefault();

			// ADD COUPON
			processAddCoupon( e.target.closest( _settings.couponFieldSelector ) );
		}
	};



	/**
	 * Use the same method that WooCommerce uses to block other parts of the checkout form while updating.
	 * The UI is unblocked by the WooCommerce `checkout.js` script (which is replaced with a modified version but keeps the same behavior)
	 * using the checkout fragment selector, then unblocking after the checkout update is completed.
	 *
	 * @param   HTMLElement  element  Element to block the UI and show the loading indicator.
	 */
	_publicMethods.blockUI = function( element ) {
		// Bail if element is invalid
		if ( ! element ) { return; }

		$( element ).addClass( _settings.uiProcessingClass ).block( {
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6
			}
		} );
	}

	/**
	 * Unblock UI element to be used again.
	 *
	 * @param   HTMLElement  element  Element to get the UI unblocked.
	 *
	 * @see  blockUI
	 */
	_publicMethods.unblockUI = function( element ) {
		$( element ).removeClass( _settings.uiProcessingClass ).unblock();
	}



	/**
	 * Add a coupon code to the cart.
	 *
	 * @param   string  couponCode  The coupon code to be added to the cart.
	 */
	_publicMethods.addCouponCode = function( couponCode, referenceElement ) {
		// Bail if coupon code was not provided
		if ( ! couponCode || '' == couponCode ) { return; }

		clearNotices();

		// Get reference id and save to reference element
		var reference_id = Math.floor( Math.random() * 1000 );
		if ( referenceElement ) {
			referenceElement.setAttribute( _settings.referenceIdAttribute, reference_id );
		}

		// Block coupon section
		var couponAddedSection = document.querySelector( _settings.couponAddedSectionSelector );
		_publicMethods.blockUI( couponAddedSection );

		// Add security nonce
		var data = {
			security: _settings.addCouponCodeNonce,
			coupon_code: couponCode,
			reference_id: reference_id,
		}

		$.ajax({
			type:		'POST',
			url:		fcSettings.wcAjaxUrl.replace( '%%endpoint%%', 'fc_add_coupon_code' ),
			data:		data,
			dataType:   'json',
			success:	function( response ) {

				// Get back the reference id
				var referenceElement;
				if ( response.reference_id ) {
					referenceElement = document.querySelector( '[' + _settings.referenceIdAttribute + '="' + response.reference_id + '"]' );
				}

				// Maybe process success
				if ( response.result && 'success' === response.result ) {
					// Maybe add messages
					if ( response.message && 'yes' !== _settings.suppressSuccessMessages ) {
						showNotices( response.message, referenceElement );
					}

					// Maybe remove coupon code value from the field
					var couponField = document.querySelector( _settings.couponFieldSelector );
					if ( couponField ) {
						couponField.value = '';
					}

					// Maybe close the coupon code field section
					if ( window.CollapsibleBlock ) {

						// Get expansible content section
						var expansibleCouponContent = referenceElement.closest( _settings.expansibleCouponContentSelector );

						// Maybe collapse/expanse sections after adding coupon
						if ( expansibleCouponContent ) {
							// Collapse the coupon code field content section
							CollapsibleBlock.collapse( expansibleCouponContent );

							// Get section key and toggle elements
							var section_key = expansibleCouponContent.getAttribute( _settings.expansibleCouponSectionKeyAttribute );
							var expansibleCouponToggle = document.querySelector( _settings.expansibleCouponToggleSelector + '--' + section_key );
							var expansibleCouponToggleButton = document.querySelector( _settings.expansibleCouponToggleButtonSelector + '--' + section_key );

							// Maybe expand coupon code toggle section
							if ( expansibleCouponToggle ) {
								CollapsibleBlock.expand( expansibleCouponToggle );
							}

							// Maybe focus back to the add coupon code button
							if ( expansibleCouponToggleButton ) {
								expansibleCouponToggleButton.focus();
							}
						}
					}
					
					$( document.body ).trigger( 'wc_fragment_refresh' );
					$( document.body ).trigger( 'applied_coupon_in_checkout', [ data.coupon_code ] );
					$( document.body ).trigger( 'update_checkout', { update_shipping_method: false } );
				}
				// Maybe process error
				else if ( response.result && 'error' === response.result ) {
					// Display new messages
					showNotices( response.message, referenceElement );

					// Unblock coupon section
					var couponAddedSection = document.querySelector( _settings.couponAddedSectionSelector );
					if ( couponAddedSection ) {
						_publicMethods.unblockUI( couponAddedSection );
					}
				}

			}

		});
	};



	/**
	 * Remove coupon from the cart.
	 *
	 * @param   string  couponCode  The coupon code to be removed from the cart.
	 */
	_publicMethods.removeCouponCode = function( couponCode, referenceElement ) {
		// Bail if coupon code was not provided
		if ( ! couponCode || '' == couponCode ) { return; }

		clearNotices();

		// Get reference id and save to reference element
		var reference_id = Math.floor( Math.random() * 1000 );
		if ( referenceElement ) {
			referenceElement.setAttribute( _settings.referenceIdAttribute, reference_id );
		}

		// Block coupon section
		var couponAddedSection = document.querySelector( _settings.couponAddedSectionSelector );
		_publicMethods.blockUI( couponAddedSection );

		// Add security nonce
		var data = {
			security: _settings.removeCouponCodeNonce,
			coupon_code: couponCode,
			reference_id: reference_id,
		}

		$.ajax({
			type:		'POST',
			url:		fcSettings.wcAjaxUrl.replace( '%%endpoint%%', 'fc_remove_coupon_code' ),
			data:		data,
			dataType:   'json',
			success:	function( response ) {
				// Get back the reference id
				var referenceElement;
				if ( response.reference_id ) {
					referenceElement = document.querySelector( '[' + _settings.referenceIdAttribute + '="' + response.reference_id + '"]' );
				}

				// Maybe process success
				if ( response.result && 'success' === response.result ) {
					// Maybe add messages
					if ( response.message && 'yes' !== _settings.suppressSuccessMessages ) {
						showNotices( response.message, referenceElement );
					}
					
					$( document.body ).trigger( 'wc_fragment_refresh' );
					$( document.body ).trigger( 'removed_coupon_in_checkout', [ data.coupon_code ] );
					$( document.body ).trigger( 'update_checkout', { update_shipping_method: false } );
				}
				// Maybe process error
				else if ( response.result && 'error' === response.result ) {
					// Display new messages
					showNotices( response.message, referenceElement );

					// Unblock coupon section
					var couponAddedSection = document.querySelector( _settings.couponAddedSectionSelector );
					if ( couponAddedSection ) {
						_publicMethods.unblockUI( couponAddedSection );
					}
				}

			}

		});
	};



	/**
	 * Finish to initialize component and set related handlers.
	 */
	var finishInit = function() {
		// Add event listeners
		window.addEventListener( 'click', handleClick );
		document.addEventListener( 'keydown', handleKeyDown, true );

		// Add init class
		document.body.classList.add( _settings.bodyClass );

		_hasInitialized = true;
	}



	/**
	 * Initialize component and set related handlers.
	 */
	_publicMethods.init = function( options ) {
		if ( _hasInitialized ) return;

		// Merge settings
		_settings = extend( _settings, options );

		// Finish initialization, maybe load dependencies first
		if ( window.CollapsibleBlock ) {
			finishInit();
		}
		else if( window.RequireBundle ) {
			RequireBundle.require( [ 'collapsible-block' ], function() { finishInit(); } );
		}
	};



	//
	// Public APIs
	//
	return _publicMethods;

});
