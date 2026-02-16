/**
 * App config. Add any global config here.
 */

/** Airtable form: field name for package selection (must match your form field exactly). prefill_Package is sent in the iframe URL. */
var AIRTABLE_PACKAGE_FIELD = "Package";

/** Airtable form: field name for quantity (must match your form field exactly). prefill_QTY is sent in the iframe URL. */
var AIRTABLE_QTY_FIELD = "QTY";

/** In Airtable's form design, set Package and QTY fields to "Hidden" (or read-only) so users cannot edit them; they see the Order Summary above the iframe instead. */
