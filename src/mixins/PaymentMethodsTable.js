import { flatten, some } from 'lodash-es';
import assert from 'simple-assert';

export default {
  methods: {
    $_PaymentMethodsTable_flattenDataList(dataList, parentProp) {
      assert(parentProp, 'parentProp must be defined');
      const result = [];
      dataList.forEach((item) => {
        result.push(item);
        if (item.items && item.isExpanded) {
          result.push(
            ...item.items.map(sub => ({ ...sub, parent: item[parentProp] })),
          );
        }
      });
      return result;
    },
    $_PaymentMethodsTable_offChanged(dataList, activeFieldNames) {
      (activeFieldNames || []).map((name) => {
        (dataList || []).map((item) => {
          item[name].hasChanges = false;
          (item.items || []).map((child) => {
            child[name].hasChanges = false;
            return child;
          });
          return item;
        });
        return name;
      });
    },
    $_PaymentMethodsTable_getIsGroupHasChanges(rowData, activeFieldNames) {
      if (rowData.parent) {
        return false;
      }
      const hasChangesArray = [rowData, ...(rowData.items ? rowData.items : [])]
        .map(item => activeFieldNames.map(name => (item[name] ? item[name].hasChanges : false)));

      return some(flatten(hasChangesArray), item => item);
    },
    $_PaymentMethodsTable_getIsGroupHasError(rowData, activeFieldNames) {
      if (rowData.parent) {
        return false;
      }
      const hasChangesArray = [rowData, ...(rowData.items ? rowData.items : [])]
        .map(item => activeFieldNames.map(name => (item[name] ? item[name].hasError : false)));

      return some(flatten(hasChangesArray), item => item);
    },
    $_PaymentMethodsTable_getEditableCellProps(field) {
      if (!field) {
        return {
          isInactive: true,
        };
      }
      return {
        isEditable: true,
        hasChanges: !field.hasError && field.hasChanges,
        hasError: field.hasError,
        hasFocus: field.hasFocus,
        value: field.value,
      };
    },
    $_PaymentMethodsTable_getCellText(value, symbol) {
      if (value) {
        return `${value}${symbol}`;
      }
      return value;
    },
    $_PaymentMethodsTable_getFieldText(field, symbol = '') {
      if (!field) {
        return '–';
      }
      const { value } = field;
      if (value) {
        return `${value}${symbol}`;
      }
      return value;
    },
    $_PaymentMethodsTable_handleCellChange(field, value) {
      if (!value) {
        field.hasError = true;
      } else {
        field.hasError = false;
      }
      field.value = value;

      if (Number(field.value) !== 1) {
        field.hasChanges = true;
      } else {
        field.hasChanges = false;
      }
    },
    $_PaymentMethodsTable_moveFocus({
      index,
      fieldName,
      focusMoveDirection,
      activeFieldNames,
      flattenedDataList,
    }) {
      flattenedDataList[index][fieldName].hasFocus = false;
      const fieldIndex = activeFieldNames.indexOf(fieldName);
      let newFieldName = fieldName;
      let newIndex = index;

      if (focusMoveDirection === 'right') {
        if (fieldIndex + 1 === activeFieldNames.length) {
          [newFieldName] = activeFieldNames;
        } else {
          newFieldName = activeFieldNames[fieldIndex + 1];
        }
      }
      if (focusMoveDirection === 'left') {
        if (fieldIndex === 0) {
          newFieldName = activeFieldNames[activeFieldNames.length - 1];
        } else {
          newFieldName = activeFieldNames[fieldIndex - 1];
        }
      }
      if (focusMoveDirection === 'up') {
        if (index === 0) {
          newIndex = flattenedDataList.length - 1;
        } else {
          newIndex = index - 1;
        }
      }
      if (focusMoveDirection === 'down') {
        if (index + 1 === flattenedDataList.length) {
          newIndex = 0;
        } else {
          newIndex = index + 1;
        }
      }
      flattenedDataList[newIndex][newFieldName].hasFocus = true;
    },
  },
};
