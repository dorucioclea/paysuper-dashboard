<script>
import {
  get, find, sortBy,
} from 'lodash-es';
import setStructureTreeUtm from '../helpers/setStructureTreeUtm';

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
    const source = setStructureTreeUtm(this.utmDataOrdered);

    this.sourceList = source;
  },
};
</script>

<template>
<div class="charts-payments">
  <div class="box">
    <UiHeader level="3">
      UTM statistics
    </UiHeader>

    <UiScrollbarBox class="scrollbox">
      <UiTable class="table">
        <UiTableRow :isHead="true">
          <UiTableCell align="left" class="cell-utm">
            UTM Source
          </UiTableCell>
          <UiTableCell align="left">Clicks</UiTableCell>
          <UiTableCell align="left">Payments</UiTableCell>
          <UiTableCell align="left">Conversion</UiTableCell>
          <UiTableCell align="right">Revenue</UiTableCell>
        </UiTableRow>
        <template
          v-for="(item, index) in sourceList"
        >
          <UiTableRow :key="index">
            <UiTableCell align="left"
              class="cell-utm"
              >
              <span class="expand">
                <IconPlusTree v-if="!item.expand" @click.native="sourceList[index].expand = true"/>
                <IconMinusTree v-if="item.expand" @click.native="sourceList[index].expand = false"/>
              </span>
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
          <template v-if="item.medium && item.medium.length > 0 && item.expand">
            <template v-for="(medium, indexM) in item.medium">
              <UiTableRow
                class="row row_c"
                :key="`${indexM}${index}`"
              >
                <UiTableCell align="left"
                  class="cell-utm"
                >
                  <span class="medium">
                    <span class="expand">
                      <IconPlusTree v-if="!medium.expand" @click.native="medium.expand = true"/>
                      <IconMinusTree v-if="medium.expand" @click.native="medium.expand = false"/>
                    </span>
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
              <template v-if="medium.campaign && medium.campaign.length > 0 && medium.expand">
                <UiTableRow
                  class="row_c"
                  v-for="(campaign, indexC) in medium.campaign"
                  :key="`${indexC}${indexM}${index}`"
                >
                  <UiTableCell align="left"
                    class="cell-utm"
                  >
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
  margin-bottom: 16px;
  flex-wrap: wrap;
  max-height: 570px;
  overflow: hidden;
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
.row_c {
  background-color: #F7F9FA;
}
.expand {
  position: relative;
  top: 2px;
  padding-right: 8px;
  cursor: pointer;
}
.cell-utm {
  width: 290px;
}
</style>
