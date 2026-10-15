const messages={
 checkout_timeout:['El pago está tardando demasiado en abrirse. Comprueba tu conexión y vuelve a intentarlo.','Checkout is taking too long to open. Check your connection and try again.'],
 verification_required:['Confirma tu correo antes de abrir el pago seguro.','Verify your email before opening secure checkout.'],
 authentication_required:['Inicia sesión para abrir el pago seguro.','Sign in to open secure checkout.'],
 invalid_session:['Tu sesión ha vencido. Vuelve a iniciar sesión para continuar con el pago.','Your session expired. Sign in again to continue checkout.'],
 subscription_already_active:['Tu cuenta ya tiene una suscripción activa. Puedes administrarla desde aquí.','Your account already has an active subscription. You can manage it here.'],
 billing_configuration_invalid:['No podemos abrir los pagos en este momento. El equipo debe revisar la conexión con Stripe. No se realizó ningún cobro.','Payments cannot be opened right now. Our team needs to check the Stripe connection. You have not been charged.'],
 billing_price_unavailable:['El plan elegido no está disponible para comprar en este momento. No se realizó ningún cobro.','The selected plan is currently unavailable to purchase. You have not been charged.'],
 billing_busy:['El servicio de pagos está ocupado. Espera un momento y vuelve a intentarlo.','The payment service is busy. Wait a moment and try again.'],
 access_policy_unavailable:['No pudimos comprobar el acceso de la cuenta. Vuelve a intentarlo en unos minutos.','We could not check account access. Try again in a few minutes.'],
};
export function billingErrorMessage(error,language='es'){
 return (messages[error?.code]||['No pudimos abrir el pago seguro. Vuelve a intentarlo.','We could not open secure checkout. Please try again.'])[language==='es'?0:1];
}
