import { filter } from 'lodash-es';

export default function getStructureTreeUtm(utmDataOrdered) {
  const source = [];
  /* set source */
  utmDataOrdered.forEach((utmDataOrderedItem) => {
    const filteredArr = filter(source, o => o.source === utmDataOrderedItem.utm.utm_source);
    if (filteredArr.length === 0) {
      source.push({ source: utmDataOrderedItem.utm.utm_source });
    }
  });

  /* summ source amd set medium */
  source.forEach((itemSource, indexSource) => {
    let amount = 0;
    let conversion = 0;
    let visits = 0;
    const mediumArr = [];
    const filteredArr = filter(utmDataOrdered, o => o.utm.utm_source === itemSource.source);
    if (filteredArr.length !== 0) {
      filteredArr.forEach((itemSourceSumm) => {
        amount += itemSourceSumm.gross_total_amount;
        conversion += itemSourceSumm.conversion;
        visits += itemSourceSumm.visits;
      });

      /* set medium */
      filteredArr.forEach((filteredArrItem) => {
        let amountM = 0;
        let conversionM = 0;
        let visitsM = 0;

        const filteredArrMedium = filter(mediumArr, (o) => {
          const m = filteredArrItem.utm.utm_medium;
          const s = filteredArrItem.utm.utm_source;
          return o.medium === m && o.source === s;
        });

        if (filteredArrMedium.length === 0) {
          const m = filteredArrItem.utm.utm_medium;
          const filteredArrMediumData = filter(filteredArr, o => o.utm.utm_medium === m);

          filteredArrMediumData.forEach((filteredArrMediumDataItem) => {
            amountM += filteredArrMediumDataItem.gross_total_amount;
            conversionM += filteredArrMediumDataItem.conversion;
            visitsM += filteredArrMediumDataItem.visits;
          });

          mediumArr.push({
            medium: filteredArrItem.utm.utm_medium,
            source: itemSource.source,
            campaign: filteredArrMediumData,
            data: {
              visits: visitsM,
              conversion: conversionM,
              amount: amountM,
            },
            expand: false,
          });
        }
      });

      source[indexSource] = {
        source: itemSource.source,
        data: {
          visits,
          conversion,
          amount,
        },
        medium: mediumArr,
        expand: false,
      };
    }
  });

  return source;
}
