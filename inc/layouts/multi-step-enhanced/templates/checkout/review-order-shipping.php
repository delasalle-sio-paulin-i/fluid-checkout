<?php
/**
 * Shipping Methods Display
 *
 * In 2.1 we show methods per package. This allows for multiple methods per order if so desired.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/cart-shipping.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce/Templates
 * @version 3.6.0
 */

defined( 'ABSPATH' ) || exit;

$method = array_key_exists( $chosen_method, $available_methods ) ? $available_methods[ $chosen_method ] : null;
?>
<tr class="woocommerce-shipping-totals shipping">
	<th><?php echo wp_kses_post( $package_name ); ?></th>
	<td data-title="<?php echo esc_attr( $package_name ); ?>">
		<?php if ( $method ) : ?>
			<?php printf( '<span class="shipping_method_%1$s_%2$s">%3$s</span>', $index, esc_attr( sanitize_title( $method->id ) ), wc_cart_totals_shipping_method_label( $method ) ); // WPCS: XSS ok. ?>
		<?php else :
			// Translators: $s shipping destination.
			echo wp_kses_post( apply_filters( 'wfc_checkout_no_shipping_method_chosen_html', sprintf( esc_html__( 'No shipping method chosen for %s.', 'woocommerce' ) . ' ', '<strong>' . esc_html( $formatted_destination ) . '</strong>' ) ) );
		endif; ?>
	</td>
</tr>
