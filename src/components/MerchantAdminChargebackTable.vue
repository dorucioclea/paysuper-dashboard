<script>
import { map, tail } from 'lodash-es';
import ClickOutside from 'vue-click-outside';
import PaymentMethodsTable from '@/mixins/PaymentMethodsTable';
import ExpandableCellText from '@/components/ExpandableCellText.vue';
import prepareActiveFields from '@/helpers/prepareActiveFields';

export default {
  name: 'MerchantAdminRefundCostsTable',
  mixins: [PaymentMethodsTable],

  components: {
    ExpandableCellText,
  },

  directives: {
    ClickOutside,
  },

  props: {
    chargeback: {
      required: true,
      type: Array,
    },
  },

  data() {
    const activeFieldNames = ['fixedFee'];
    return {
      activeFieldNames,
      innerСhargeback: [{
        ...this.chargeback[0],
        ...prepareActiveFields(this.chargeback[0], activeFieldNames),
        name: 'Chargeback',
        isExpanded: false,
        isPayoutPartyMenuOpened: false,
        items: map(tail(this.chargeback), item => ({
          ...item,
          ...prepareActiveFields(item, activeFieldNames),
          isPayoutPartyMenuOpened: false,
        })),
      }],
      payoutPartyList: ['PaySuper', 'Merchant'],
    };
  },

  computed: {
    chargebackMainListFlattened() {
      return this.$_PaymentMethodsTable_flattenDataList(this.innerСhargeback, 'name');
    },
  },

  methods: {
    closePayoutPartyMenu(data) {
      data.isPayoutPartyMenuOpened = false;
    },
    handlePayoutPartyMenuItemClick(data, item) {
      if (data.payoutParty === item) {
        return;
      }
      data.payoutParty = item;
      data.isPayoutPartyMenuOpened = false;
    },
  },
};
</script>

<template>
<div>
  <UiComplexTable>
    <UiComplexTableRow :isHead="true">
      <UiComplexTableCell class="cell _method">For all methods</UiComplexTableCell>
      <UiComplexTableCell class="cell _currency">Payout currency</UiComplexTableCell>
      <UiComplexTableCell class="cell _region">Region</UiComplexTableCell>
      <UiComplexTableCell class="cell _fee">Fixed fee</UiComplexTableCell>
      <UiComplexTableCell class="cell _fee">Chargeback fee payout party</UiComplexTableCell>
    </UiComplexTableRow>
    <template
      v-for="(data, index) in chargebackMainListFlattened"
    >
      <UiComplexTableRow
        :key="index"
        :isPainted="index % 2 === 1"
      >
        <UiComplexTableCell
        :class="['cell', '_method', { '_leading': !data.parent }]"
          align="left"
          :isCollapsed="!!data.parent"
          :hasChanges="$_PaymentMethodsTable_getIsGroupHasChanges(data, activeFieldNames)"
          @click.native="data.isExpanded = !data.isExpanded"
        >
          <ExpandableCellText
            v-if="index === 0"
            :isOpened="data.isExpanded"
          >
            Chargeback
          </ExpandableCellText>
        </UiComplexTableCell>
        <UiComplexTableCell class="cell _currency">{{ data.payoutCurrency }}</UiComplexTableCell>
        <UiComplexTableCell class="cell _region">{{ data.region }}</UiComplexTableCell>
        <UiComplexTableCell
          class="cell _fee"
          v-bind="$_PaymentMethodsTable_getEditableCellProps(data.fixedFee)"
          @toggleFocus="data.fixedFee.hasFocus = $event"
          @moveFocus="moveFocus(index, 'fixedFee', $event)"
          @change="$_PaymentMethodsTable_handleCellChange(data.fixedFee, $event)"
          mask="NNNNNN"
        >
          {{ $_PaymentMethodsTable_getCellText(data.fixedFee.value, data.fixedFeeCurrency) }}
        </UiComplexTableCell>
        <UiComplexTableCell
          class="cell _payout-party"
          @click.native="data.isPayoutPartyMenuOpened = !data.isPayoutPartyMenuOpened"
          v-click-outside="() => closePayoutPartyMenu(data)"
        >
          <div class="payout-party">
            {{ data.payoutParty }}
            <UiOpenerCorner :isOpened="data.isPayoutPartyMenuOpened" />
          </div>

          <UiTip
            innerPosition="right"
            position="bottom"
            width="180px"
            :margin="0"
            :visible="data.isPayoutPartyMenuOpened"
            :closeDelay="0"
            :stayOpenedOnHover="false"
          >
            <UiTooltipMenuItem
              v-for="(item, index) in payoutPartyList"
              v-text="item"
              :key="index"
              :isCurrent="data.payoutParty === item"
              @click.native.stop="handlePayoutPartyMenuItemClick(data, item)"
            />
          </UiTip>
        </UiComplexTableCell>
      </UiComplexTableRow>
    </template>
  </UiComplexTable>
</div>
</template>

<style lang="scss" scoped>
.cell {
  &._method {
    width: 28%;

    &._leading {
      cursor: pointer;
    }
  }
  &._currency {
    width: 10%;
  }
  &._region {
    width: 10%;
  }
  &._country {
    width: 18%;
  }
  &._fee {
    width: 20%;
  }
  &._payout-party {
    width: 20%;
    cursor: pointer;
    position: relative;
  }
}
.payout-party {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 9px;
}

.secondary-table {
  margin-top: 16px;
}
</style>
