<?php
defined( 'ABSPATH' ) || exit;

/**
 * Compatibility with theme: Divi (by Elegant Themes).
 */
class FluidCheckout_ThemeCompat_Divi extends FluidCheckout {

	/**
	 * __construct function.
	 */
	public function __construct() {
		$this->hooks();
	}



	/**
	 * Initialize hooks.
	 */
	public function hooks() {
		// JS settings object
		add_filter( 'fc_js_settings', array( $this, 'add_js_settings' ), 10 );

		// Use theme's logo
		add_action( 'fc_checkout_header_logo', array( $this, 'output_checkout_header_logo' ), 10 );

		// Sticky elements
		add_filter( 'fc_checkout_progress_bar_attributes', array( $this, 'change_sticky_elements_relative_header' ), 20 );
		add_filter( 'fc_checkout_sidebar_attributes', array( $this, 'change_sticky_elements_relative_header' ), 20 );
				// Container class
				add_filter( 'fc_add_container_class', '__return_false' );
				add_filter( 'fc_content_section_class', array( $this, 'change_fc_content_section_class' ), 20 );
		
	}



	/**
	 * Add settings to the plugin settings JS object.
	 *
	 * @param   array  $settings  JS settings object of the plugin.
	 */
	public function add_js_settings( $settings ) {
		// Bail if using the plugin's header and footer
		if ( FluidCheckout_Steps::instance()->get_hide_site_header_footer_at_checkout() ) { return $settings; }

		// Add settings
		$settings[ 'checkoutSteps' ][ 'scrollOffsetSelector' ] = '#main-header';

		return $settings;
	}
/**
	 * Add container class to the main content element.
	 *
	 * @param string $class Main content element classes.
	 */
	public function change_fc_content_section_class( $class ) {

		return $class . ' container';
	}


	/**
	 * Output the theme logo on the plugin's checkout header.
	 */
	public function output_checkout_header_logo() {
		if ( function_exists( 'et_get_option' ) ) {
			$template_directory_uri   = get_template_directory_uri();
			$logo = ( $user_logo = et_get_option( 'divi_logo' ) ) && ! empty( $user_logo )
			? $user_logo
			: $template_directory_uri . '/images/logo.png';

			// Get logo image size based on attachment URL.
			$logo_size   = et_get_attachment_size_by_url( $logo );
			$logo_width  = ( ! empty( $logo_size ) && is_numeric( $logo_size[0] ) )
					? $logo_size[0]
					: '93'; // 93 is the width of the default logo.
			$logo_height = ( ! empty( $logo_size ) && is_numeric( $logo_size[1] ) )
					? $logo_size[1]
					: '43'; // 43 is the height of the default logo.

			ob_start();
			?>
				<a href="<?php echo esc_url( apply_filters( 'fc_checkout_header_logo_home_url', home_url( '/' ) ) ); ?>">
					<img src="<?php echo esc_attr( $logo ); ?>" width="<?php echo esc_attr( $logo_width ); ?>" height="<?php echo esc_attr( $logo_height ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" id="logo" data-height-percentage="<?php echo esc_attr( et_get_option( 'logo_height', '54' ) ); ?>" />
				</a>
			<?php
			$logo_container = ob_get_clean();
			echo $logo_container;
		}
	}



	/**
	 * Change the sticky element relative ID.
	 *
	 * @param   array   $attributes    HTML element attributes.
	 */
	public function change_sticky_elements_relative_header( $attributes ) {
		// Bail if using the plugin's header and footer
		if ( FluidCheckout_Steps::instance()->get_hide_site_header_footer_at_checkout() ) { return $attributes; }

		$attributes['data-sticky-relative-to'] = '#main-header';

		return $attributes;
	}

}

FluidCheckout_ThemeCompat_Divi::instance();
