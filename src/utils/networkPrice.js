// How the Flux network ends a USD price, mirrored so a total this UI works out itself is never
// below the one the network calculates for the same order.
//
// Since FluxOS PR #1818 (2026-09-25) /apps/calculatefiatandfluxprice rounds its final USD figure
// up to the next price ending in .49 or .99 (appSpecHelpers.js, `roundUpToCharmPrice`), and it
// does that to the WHOLE order, after the 3/6/12% duration discount. A multi-month total built
// here as monthly × months × (1 − discount) skips that last step and can come out under the
// network's figure: $1.99 × 3 × 0.97 = $5.79 against a quote of $5.99. The payment bridge refuses
// a price below 98% of the quote ("invalid price supplied"), so that order could not be paid.
//
// Rounding the local total the same way keeps it at or above the network's: the monthly price it
// starts from is at or above the network's monthly quote, and rounding up is monotonic. A
// one-month total already ends in .49/.99 and comes back unchanged.

/**
 * Round a USD price up to the next price ending in .49 or .99 (1.12 -> 1.49, 1.50 -> 1.99).
 * A price already ending in .49 or .99 is kept. Same arithmetic as FluxOS: whole cents first,
 * so float noise (4.49 * 100 = 449.00000000000006) cannot push .49 up to .99.
 * @param {number|string} usdPrice
 * @returns {number}
 */
export const roundUpToCharmPrice = usdPrice => {
  const cents = Math.round(Number(usdPrice) * 100)
  if (!Number.isFinite(cents) || cents <= 0) return 0
  const dollars = Math.floor(cents / 100)
  const charmCents = cents % 100 <= 49 ? 49 : 99

  return (dollars * 100 + charmCents) / 100
}

/**
 * The USD total of a subscription: monthly × months, less the duration discount, ended the way
 * the network ends it.
 * @param {number} monthly - Monthly USD price
 * @param {number} months - Subscription length in months
 * @param {number} discountPercent - Duration discount, e.g. 3 for 3%
 * @returns {number}
 */
export const subscriptionTotalUsd = (monthly, months, discountPercent) =>
  roundUpToCharmPrice(monthly * months * (1 - discountPercent / 100))
