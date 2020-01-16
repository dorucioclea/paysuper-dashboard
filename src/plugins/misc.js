import Vue from 'vue';
import { extend } from 'lodash-es';
import { format } from 'date-fns';
import { showSuccessMessage, showErrorMessage } from '@/helpers/notifications';

function $navigate(pathOrOptions, query = {}) {
  if (typeof pathOrOptions === 'string') {
    this.$router.push({ path: pathOrOptions, query });
  } else {
    this.$router.push(pathOrOptions);
  }
}

function $formatPrice(value, currency) {
  if (value === null || value === undefined) {
    return '';
  }
  return new Intl.NumberFormat(
    this.$i18n.locale,
    (currency ? { style: 'currency', currency } : {}),
  ).format(value);
}

/**
 * Accepts timestamp in seconds/miliseconds and DateObject
 *
 * @typedef {{seconds: number}} DateObject
 * @param {(string | number | DateObject)} date
 * @param {string} mask
 * @return {string}
 */
function $formatDate(date, mask = 'dd MMM yyyy') {
  if (!date) {
    return '';
  }
  const dateType = typeof date;
  let timestamp;
  if (dateType === 'number' || dateType === 'string') {
    const { length } = String(date);
    if (length === 13) {
      timestamp = date;
    } else if (length === 10) {
      timestamp = date * 1000;
    } else {
      throw new Error('Unaccaptable date to format');
    }
  } else if (dateType === 'object') {
    timestamp = date.seconds * 1000;
  }
  const datetime = new Date(timestamp);
  return format(datetime, mask);
}

function $appEventsOn(eventName, handler) {
  this.$appEvents.$on(eventName, handler);
  this.$on('hook:destroyed', () => {
    this.$appEvents.$off(eventName, handler);
  });
}

extend(Vue.prototype, {
  $appEvents: new Vue(),
  $appEventsOn,
  $navigate,
  $formatPrice,
  $formatDate,
  $showSuccessMessage: showSuccessMessage,
  $showErrorMessage: showErrorMessage,
});
