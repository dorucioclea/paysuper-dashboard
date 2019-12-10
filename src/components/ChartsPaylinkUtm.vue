<script>
import {
  get, find, filter, sortBy, groupBy,
} from 'lodash-es';

export default {
  name: 'ChartsPaylinkUtm',
  props: {
    countries: {
      default: () => [],
      type: Array,
    },
    currency: {
      default: 'USD',
      type: String,
    },
    utmData: {
      default: () => {},
      type: Object,
    },
  },

  data() {
    return {
      sourceList: [],
    };
  },

  computed: {
    utmDataOrdered() {
      const arr = this.utmData.top;
      return sortBy(arr, ['utm.utm_source', 'utm.utm_medium', 'utm_campaign']);
    },
    utmDataGrouped() {
      const arr = this.utmDataOrdered;
      return console.log(groupBy(arr, ['utm.utm_source', 'utm.utm_medium', 'utm_campaign']));
    },
  },
  methods: {
    get,
    getProjectName(project) {
      return get(
        project,
        `name.${this.$i18n.locale}`,
        get(project, 'notify_emails.0', get(project, 'merchant_id')),
      );
    },
    getCountryByCode(code) {
      return get(find(this.countries, ({ value }) => value === code), 'label', code);
    },
  },

  mounted() {
    const source = [];

    /* set source */
    this.utmDataOrdered.forEach((utmDataOrderedItem) => {
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
      const filteredArr = filter(this.utmDataOrdered, o => o.utm.utm_source === itemSource.source);

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
        };
      }
    });

    console.log(source);
    this.sourceList = source;
  },
};
</script>

<template>
<div class="charts-payments">
  <div class="box">
    <div class="box-header">
      <div class="box-title">UTM statistics</div>
    </div>

    <UiScrollbarBox class="scrollbox">
      <UiTable class="table">
        <UiTableRow :isHead="true">
          <UiTableCell align="left">UTM Source</UiTableCell>
          <UiTableCell align="left">Clicks</UiTableCell>
          <UiTableCell align="left">Payments</UiTableCell>
          <UiTableCell align="left">Conversion</UiTableCell>
          <UiTableCell align="right">Revenue</UiTableCell>
        </UiTableRow>
        <template
          v-for="(item, index) in sourceList"
        >
          <UiTableRow :key="index">
            <UiTableCell align="left">
              {{ item.source }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ item.data.visits }}
            </UiTableCell>
            <UiTableCell align="left">
              —
            </UiTableCell>
            <UiTableCell align="left">
              {{ item.data.conversion }}
            </UiTableCell>
            <UiTableCell align="right" class="cyan">
              {{ $formatPrice(item.data.amount, currency) }}
            </UiTableCell>
          </UiTableRow>
          <template v-if="item.medium && item.medium.length > 0">
            <template v-for="(medium, indexM) in item.medium">
              <UiTableRow
                class="row"
                :key="indexM"
              >
                <UiTableCell align="left">
                  <span class="medium">
                    {{ medium.medium }}
                  </span>
                </UiTableCell>
                <UiTableCell align="left">
                  {{ medium.data.visits }}
                </UiTableCell>
                <UiTableCell align="left">
                  —
                </UiTableCell>
                <UiTableCell align="left">
                  {{ medium.data.conversion }}
                </UiTableCell>
                <UiTableCell align="right" class="cyan">
                  {{ $formatPrice(medium.data.amount, currency) }}
                </UiTableCell>
              </UiTableRow>
              <template v-if="medium.campaign && medium.campaign.length > 0">
                <UiTableRow
                  v-for="(campaign, indexC) in medium.campaign"
                  :key="indexC"
                >
                  <UiTableCell align="left">
                    <span class="campaign">
                      {{ campaign.utm.utm_campaign }}
                    </span>
                  </UiTableCell>
                  <UiTableCell align="left">
                    {{ campaign.visits }}
                  </UiTableCell>
                  <UiTableCell align="left">
                    —
                  </UiTableCell>
                  <UiTableCell align="left">
                    {{ campaign.conversion }}
                  </UiTableCell>
                  <UiTableCell align="right" class="cyan">
                    {{ $formatPrice(campaign.gross_total_amount, currency) }}
                  </UiTableCell>
                </UiTableRow>
              </template>
             </template>
          </template>
        </template>
      </UiTable>
    </UiScrollbarBox>
  </div>
</div>
</template>

<style lang="scss" scoped>
.charts-payments {
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.box {
  display: flex;
  justify-content: space-between;
  flex-basis: 100%;
  background-color: #fff;
  box-shadow: 0px 1px 2px rgba(8, 35, 48, 0.24), 0px 2px 6px rgba(8, 35, 48, 0.16);
  border-radius: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  height: 570px;
  padding: 24px;
  overflow: hidden;
}
.box-header {
  display: flex;
  flex-basis: 100%;
  justify-content: space-between;
}
.box-title {
  color: #000;
  font-family: Quicksand;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0.15px;
  margin-right: 16px;
}
.scrollbox {
  width: 100%;
  height: 100%;
  margin-top: 12px;
}
.table {
  padding-right: 20px;
  margin-bottom: 40px;
}
.cyan {
  color: #069697;
}
.medium {
  padding-left: 21px;
}
.campaign {
  padding-left: 63px;
}
</style>
