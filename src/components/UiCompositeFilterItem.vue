<script>
import ClickOutside from 'vue-click-outside';
import { includes } from 'lodash-es';

export default {
  name: 'UiCompositeFilterItem',

  directives: {
    ClickOutside,
  },

  props: {
    item: {
      required: true,
      type: Object,
    },
    parent: {
      default: null,
      type: Object,
    },
    countsByFilter: {
      default: null,
      type: Object,
    },
    filters: {
      required: true,
      type: Object,
    },
    currentCheckers: {
      required: true,
      type: Object,
    },
    type: {
      type: String,
      default: 'main',
      validator(value) {
        return includes(
          ['main', 'footer'],
          value,
        );
      },
    },
  },

  computed: {
    isCurrent() {
      const props = {
        ...this.parent || {},
        ...this.item,
      };
      const currentChecker = this.currentCheckers[props.filter];
      return currentChecker ? currentChecker(this.item, this.filters) : false;
    },
    getItemClass() {
      const props = {
        ...this.parent || {},
        ...this.item,
      };
      return [
        { _current: this.isCurrent },
        { _children: this.item.children },
        props.color ? `_color-${props.color}` : '',
        props.view ? `_view-${props.view}` : '',
        props.isCurrentClickable ? '_current-clickable' : '',
        `_${this.type}`,
      ];
    },
  },
};
</script>

<template>
<div
  class="ui-composite-filter-item"
  :class="getItemClass"
  @click="$emit('click', $event)"
>
  <span
    class="menu-item-icon"
    :class="getItemClass"
  >
    <UiCheckbox
      v-if="item.view === 'checkbox'"
      class="checkbox"
      readonly
      :checked="!!filters[item.filter]"
    />
    <component
      v-if="!isCurrent && item.icon"
      :is="item.icon"
    />
    <IconCheck
      v-if="isCurrent"
      width="13"
      height="10"
      stroke="#919699"
    />
  </span>

  {{ item.text }}
  <span
    class="filters-count"
    v-if="countsByFilter && countsByFilter[item.filter]"
  >
    {{ countsByFilter[item.filter] }}
  </span>
  <span class="triangle" v-if="item.children"></span>
  <slot />
</div>
</template>

<style lang="scss" scoped>
.ui-composite-filter-item {
  font-size: 14px;
  line-height: 20px;
  color: #000000;
  position: relative;
  padding: 0 16px 0 35px;
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:not(._view-clear):hover {
    background: rgba(61, 123, 245, 0.08);
    color: #3d7bf5;

    .triangle {
      border-left-color: #3d7bf5;
    }
  }

  &._view-clear:hover {
    background: rgba(234, 61, 47, 0.08);
    color: #ea3d2f;
  }

  &._children {
    padding-left: 16px;
  }

  &._main + &._footer {
    margin-top: 17px;

    &::after {
      content: "";
      top: -9px;
      left: 16px;
      right: 16px;
      background: #e3e5e6;
      height: 1px;
      position: absolute;
    }
  }

  &._current {
    &:not(._current-clickable) {
      cursor: default;
    }

    &,
    .filters-count {
      color: #919699;
    }
  }

  // &._color-archieved {
  //   border-top: 1px solid #f1f3f4;
  //   padding-top: 5px;
  //   height: 35px;
  //   margin-top: 5px;
  // }
}

.menu-item-icon {
  position: absolute;
  left: 8px;
  top: 0px;
  width: 24px;
  height: 30px;
  display: flex;
  display: flex;
  align-items: center;
  justify-content: center;

  &._view-status:not(._current)::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &._color-transparent {
    &::before {
      border: 1px solid #919699;
    }
  }

  &._color-gray {
    &::before {
      background: #919699;
    }
  }
  &._color-blue {
    &::before {
      background: #3d7bf5;
    }
  }
  &._color-yellow {
    &::before {
      background: #f3aa18;
    }
  }
  &._color-purple {
    &::before {
      background: #7e57c2;
    }
  }
  &._color-green {
    &::before {
      background: #2fa84f;
    }
  }
  &._color-red {
    &::before {
      background: #ea3d2f;
    }
  }
  &._color-cyan {
    &::before {
      background: #069697;
    }
  }
}

.checkbox {
  position: absolute;
  left: -4px;
  top: -1px;
}

.filters-count {
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
