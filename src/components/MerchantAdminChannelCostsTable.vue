<script>
import { find, map, tail } from 'lodash-es';
import PaymentMethodsTable from '@/mixins/PaymentMethodsTable';
import ExpandableCellText from '@/components/ExpandableCellText.vue';
import prepareActiveFields from '@/helpers/prepareActiveFields';

export default {
  name: 'MerchantAdminChannelCostsTable',

  mixins: [PaymentMethodsTable],

  components: {
    ExpandableCellText,
  },

  props: {
    channelCosts: {
      required: true,
      type: Object,
    },
    isUpdating: {
      default: false,
      type: Boolean,
    },
  },

  data() {
    const activeFieldNames = ['methodFee', 'fixedFee', 'overallFee', 'psGeneralFixedFee'];
    return {
      activeFieldNames,
      innerChannelCosts: map(this.channelCosts, arrByMethod => ({
        ...arrByMethod[0],
        ...prepareActiveFields(arrByMethod[0], activeFieldNames),
        isExpanded: false,
        items: map(tail(arrByMethod), item => ({
          ...item,
          ...prepareActiveFields(item, activeFieldNames),
        })),
      })),
    };
  },

  computed: {
    channelCostsFlattened() {
      return this.$_PaymentMethodsTable_flattenDataList(this.innerChannelCosts, 'method');
    },
  },

  methods: {
    moveFocus(index, fieldName, focusMoveDirection) {
      this.$_PaymentMethodsTable_moveFocus({
        index,
        fieldName,
        focusMoveDirection,
        activeFieldNames: this.activeFieldNames,
        flattenedDataList: this.channelCostsFlattened,
      });
    },
    changeCell(field, data, value) {
      this.$_PaymentMethodsTable_handleCellChange(data[field], value);
      this.$emit('changeCell', {
        ...find(this.channelCosts[data.method], { id: data.id }),
        [field]: value,
      });
    },
  },

  watch: {
    isUpdating: {
      handler(value) {
        if (!value) {
          this.$_PaymentMethodsTable_offChanged(this.innerChannelCosts, this.activeFieldNames);
        }
      },
      immediate: true,
    },
  },
};
</script>

<template>
<UiComplexTable>
  <UiComplexTableRow :isHead="true">
    <UiComplexTableCell class="cell _method" align="left">Payment Method</UiComplexTableCell>
    <UiComplexTableCell class="cell _currency">Payout currency</UiComplexTableCell>
    <UiComplexTableCell class="cell _amount">Payment amount</UiComplexTableCell>
    <UiComplexTableCell class="cell _region">Region</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">Fee</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">Fixed fee</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">Overall fee</UiComplexTableCell>
    <UiComplexTableCell class="cell _fee">PS general fixed fee</UiComplexTableCell>
  </UiComplexTableRow>
  <template v-for="(data, index) in channelCostsFlattened">
    <UiComplexTableRow
      :key="index"
      :isPainted="index % 2 === 1"
    >
      <UiComplexTableCell
        :class="['cell', '_method', { '_leading': !data.parent }]"
        align="left"
        :isCollapsed="!!data.parent"
        :hasChanges="$_PaymentMethodsTable_getIsGroupHasChanges(data, activeFieldNames)"
        :hasError="$_PaymentMethodsTable_getIsGroupHasError(data, activeFieldNames)"
        @click.native="data.isExpanded = !data.isExpanded"
      >
        <ExpandableCellText
          v-if="!data.parent"
          :isOpened="data.isExpanded"
        >
          <component
            :is="$options.components[data.icon] ? data.icon : 'IconDirectBanking'"
            class="method-icon"
          />
          {{ data.method }}
        </ExpandableCellText>
      </UiComplexTableCell>
      <UiComplexTableCell class="cell _currency">
        {{ data.payoutCurrencySymbol }}
      </UiComplexTableCell>
      <UiComplexTableCell class="cell _amount">{{ data.amount }}</UiComplexTableCell>
      <UiComplexTableCell class="cell _region">{{ data.regionAbbr }}</UiComplexTableCell>
      <UiComplexTableCell
        class="cell _fee"
        v-bind="$_PaymentMethodsTable_getEditableCellProps(data.methodFee)"
        @toggleFocus="data.methodFee.hasFocus = $event"
        @moveFocus="moveFocus(index, 'methodFee', $event)"
        @change="changeCell('methodFee', data, $event)"
        mask="#.##"
      >
        {{ $_PaymentMethodsTable_getCellText(data.methodFee.value, '%') }}
      </UiComplexTableCell>
      <UiComplexTableCell
        class="cell _fee"
        v-bind="$_PaymentMethodsTable_getEditableCellProps(data.fixedFee)"
        @toggleFocus="data.fixedFee.hasFocus = $event"
        @moveFocus="moveFocus(index, 'fixedFee', $event)"
        @change="changeCell('fixedFee', data, $event)"
        mask="#.##"
      >
        {{ $_PaymentMethodsTable_getCellText(data.fixedFee.value, data.fixedFeeCurrencySymbol) }}
      </UiComplexTableCell>
      <UiComplexTableCell
        class="cell _fee"
        v-bind="$_PaymentMethodsTable_getEditableCellProps(data.overallFee)"
        @toggleFocus="data.overallFee.hasFocus = $event"
        @moveFocus="moveFocus(index, 'overallFee', $event)"
        @change="changeCell('overallFee', data, $event)"
        mask="#.##"
      >
        {{ $_PaymentMethodsTable_getCellText(data.overallFee.value, '%') }}
      </UiComplexTableCell>
      <UiComplexTableCell
        class="cell _fee"
        v-bind="$_PaymentMethodsTable_getEditableCellProps(data.psGeneralFixedFee)"
        @toggleFocus="data.psGeneralFixedFee.hasFocus = $event"
        @moveFocus="moveFocus(index, 'psGeneralFixedFee', $event)"
        @change="changeCell('psGeneralFixedFee', data, $event)"
        mask="#.##"
      >
        {{
          $_PaymentMethodsTable_getCellText(
            data.psGeneralFixedFee.value,
            data.psGeneralfixedFeeCurrencySymbol,
          )
        }}
      </UiComplexTableCell>
    </UiComplexTableRow>
  </template>

</UiComplexTable>
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
    width: 6%;
  }
  &._amount {
    width: 8%;
  }
  &._region {
    width: 10%;
  }
  &._fee {
    width: 12%;
  }
}
.method-icon {
  width: 32px;
  height: 18px;
  margin-right: 4px;
}
</style>
