<script>
import ClickOutside from 'vue-click-outside';
import { includes, isArray } from 'lodash-es';

export default {
  name: 'UiStatusFilter',

  directives: {
    ClickOutside,
  },

  props: {
    value: {
      type: [String, Object, Array],
      default: 'all',
    },
    scheme: {
      type: Object,
      required: true,
    },
    countsByStatus: {
      type: Object,
      default: null,
    },
    align: {
      type: String,
      default: 'right',
      validator(value) {
        return includes(
          ['right', 'left'],
          value,
        );
      },
    },
  },

  data() {
    return {
      isDropdownOpened: false,
      statusesList: this.scheme,
    };
  },

  watch: {
    isDropdownOpened(value) {
      if (!value) {
        Object.keys(this.statusesList).forEach((key) => { this.statusesList[key].expand = false; });
      }
    },
  },

  methods: {
    getItemClass(item, value) {
      let current;
      if (isArray(this.value)) {
        current = this.value.includes(item.value) ? '_current' : '';
      } else {
        current = value === item.value ? '_current' : '';
      }
      return [
        item.value ? `_${item.value}` : '',
        item.color ? `_${item.color}` : '',
        current,
      ];
    },

    getChildClass(item, parent) {
      return [
        item.value ? `_${item.value}` : '',
        item.color ? `_${item.color}` : '',
        this.value[parent.value].includes(item.value) ? '_current' : '',
      ];
    },

    handleClick(item) {
      if (item.children !== undefined) {
        item.expand = !item.expand;
      } else {
        this.$emit('input', item.value);
      }
    },

    handleLevelTwoClick(item, child) {
      this.$emit('inputSecondLevel', { filter: item.value, value: child.value });
    },
  },
};
</script>

<template>
  <div class="status-filter" v-click-outside="() => isDropdownOpened = false">
    <div
      class="button"
      :class="{ '_opened': isDropdownOpened }"
      @click="isDropdownOpened = !isDropdownOpened"
    >
      <IconDropdownMenu />
    </div>
    <UiTip
      class="dropdown"
      :innerPosition="align"
      position="bottom"
      width="200px"
      :margin="4"
      :visible="isDropdownOpened"
      :closeDelay="0"
      :stayOpenedOnHover="false"
    >
      <div class="dropdown-content">
        <div
          class="status"
          v-for="(item, index) in statusesList"
          :key="index"
          :class="[getItemClass(item, value), { 'has-child': item.children }]"
          @click="handleClick(item)"
        >
          <component
            class="status-icon"
            v-if="item.icon"
            :is="item.icon"
          />
          {{item.text}}
          <span
            class="status-count"
            v-if="countsByStatus && countsByStatus[item.value]"
            >
            {{ countsByStatus[item.value] }}
          </span>
          <div class="triangle" v-if="item.children"></div>
          <UiTip
            class="dropdown-child dropdown-content"
            position="bottom"
            innerPosition="left"
            width="200px"
            :margin="0"
            :visible="item.expand"
            v-if="item.children">
            <div
              @click="handleLevelTwoClick(item, child)"
              class="status"
              v-for="(child, index) in item.children"
              :class="getChildClass(child, item)"
              :key="index">
              {{ child.text }}
            </div>
          </UiTip>
        </div>
      </div>
    </UiTip>
  </div>

</template>

<style lang="scss" scoped>
.status-filter {
  display: inline-flex;
  position: relative;
}
.button {
  width: 40px;
  height: 40px;
  display: flex;
  border: 1px solid #e3e5e6;
  box-sizing: border-box;
  border-radius: 4px;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  cursor: pointer;
  transition: all 0.2s ease-out;

  & > svg {
    transition: fill 0.2s ease-out;
  }

  &:hover:not(._opened) {
    background: rgba(61, 123, 245, 0.08);

    & > svg {
      fill: #3d7bf5;
    }
  }

  &._opened {
    background-color: #f1f3f4;
    border-color: #f1f3f4;
  }
}

.dropdown {
  top: calc(100% + 4px);

  &-child {
    left: 200px !important;
    top: -10px !important;
  }
}

.dropdown-content {
  padding: 10px 0;
}

.status {
  font-size: 14px;
  line-height: 20px;
  color: #000000;
  position: relative;
  padding: 0 16px 0 32px;
  height: 30px;
  display: flex;
  align-items: center;

  &:hover:not(._current) {
    cursor: pointer;
    background: rgba(61, 123, 245, 0.08);
    color: #3d7bf5;

    .triangle {
      border-color: transparent transparent transparent #3d7bf5;
    }
  }

  &::before {
    content: "";
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    left: 16px;
    top: 11px;
  }

  &._current {
    &,
    .status-count {
      color: #c6cacc;
    }
  }

  &._transparent {
    &::before {
      border: 1px solid #919699;
    }
  }
  &._grey {
    &::before {
      background: #c6cacc;
    }
  }
  &._gray {
    &::before {
      background: #919699;
    }
  }
  &._blue {
    &::before {
      background: #3d7bf5;
    }
  }
  &._yellow {
    &::before {
      background: #f3aa18;
    }
  }
  &._purple {
    &::before {
      background: #7e57c2;
    }
  }
  &._green {
    &::before {
      background: #2fa84f;
    }
  }
  &._red {
    &::before {
      background: #ea3d2f;
    }
  }
  &._cyan {
    &::before {
      background: #069697;
    }
  }
  &._archieved {
    border-top: 1px solid #f1f3f4;
    padding-top: 5px;
    height: 35px;
    margin-top: 5px;
  }
}

.status-icon {
  position: absolute;
  left: 12px;
  top: 12px;
}
.status-count {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0 0 0 1px;
  border-radius: 50%;
  position: absolute;
  right: 30px;
  top: 6px;
  color: #fff;
  background: #3d7bf5;
  font-size: 9px;
}

.triangle {
  position: absolute;
  right: 15px;
  top: 10px;
  display: block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 4px 0 4px 4px;
  border-color: transparent transparent transparent rgb(0, 0, 0);
}
</style>
