// Shared entitlement constants. Kept out of the "use server" actions file so
// it can be imported by client components (a "use server" module may only
// export async functions).

/** Thrown by generation when the user hasn't paid. The client catches this
 *  exact message and sends them to the paywall instead of showing an error. */
export const PAYMENT_REQUIRED = "PAYMENT_REQUIRED";
