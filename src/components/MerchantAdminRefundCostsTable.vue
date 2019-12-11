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
    refundCosts: {
      required: true,
      type: Object,
    },
  },

  data() {
    const activeFieldNames = ['methodFee', 'fixedFee'];
    return {
      activeFieldNames,
      innerRefundCosts: map(this.refundCosts, arrByMethod => ({
        ...arrByMethod[0],
        ...prepareActiveFields(arrByMethod[0], activeFieldNames),
        isExpanded: false,
        isPayoutPartyMenuOpened: false,
        items: map(tail(arrByMethod), item => ({
          ...item,
          ...prepareActiveFields(item, activeFieldNames),
          isPayoutPartyMenuOpened: false,
        })),
      })),
      payoutPartyList: ['PaySuper', 'Merchant'],
    };
  },

  computed: {
    refundCostsFlattened() {
      return this.$_PaymentMethodsTable_flattenDataList(this.innerRefundCosts, 'method');
    },
  },

  methods: {
    moveFocus(index, fieldName, focusMoveDirection) {
      this.$_PaymentMethodsTable_moveFocus({
        index,
        fieldName,
        focusMoveDirection,
        activeFieldNames: this.activeFieldNames,
        flattenedDataList: this.refundCostsFlattened,
      });
    },
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
<UiComplexTable>
  <UiComplexTableRow :isHead="true">
    <UiComplexTableCell class="cell _method" align="left">Payment Method</UiComplexTableCell>
    <UiComplexTableCell class="cell _currency">Payout currency</UiComplexTableCell>
    <UiComplexTableCell class="cell _region">Region</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">Fee</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">Fixed fee</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">Refund fee payout party</UiComplexTableCell>
  </UiComplexTableRow>
  <template
    v-for="(data, index) in refundCostsFlattened"
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
          v-if="!data.parent"
          :isOpened="data.isExpanded"
        >
          <component :is="data.icon" class="method-icon" />
          {{ data.method }}
        </ExpandableCellText>
      </UiComplexTableCell>
      <UiComplexTableCell class="cell _currency">{{ data.payoutCurrency }}</UiComplexTableCell>
      <UiComplexTableCell class="cell _region">{{ data.region }}</UiComplexTableCell>
      <UiComplexTableCell
        class="cell _fee"
        v-bind="$_PaymentMethodsTable_getEditableCellProps(data.methodFee)"
        @toggleFocus="data.methodFee.hasFocus = $event"
        @moveFocus="moveFocus(index, 'methodFee', $event)"
        @change="$_PaymentMethodsTable_handleCellChange(data.methodFee, $event)"
        mask="###"
      >
        {{ $_PaymentMethodsTable_getCellText(data.methodFee.value, '%') }}
      </UiComplexTableCell>
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
</template>

<style lang="scss" scoped>
.cell {
  &._method {
    width: 26%;

    &._leading {
      cursor: pointer;
    }
  }
  &._currency {
    width: 8%;
  }
  &._region {
    width: 10%;
  }
  &._fee {
    width: 18%;
  }
  &._payout-party {
    width: 18%;
    cursor: pointer;
    position: relative;
  }
}
.method-icon {
  width: 32px;
  height: 18px;
  margin-right: 4px;
}
.payout-party {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 9px;
}
</style>
