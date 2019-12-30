<script>
import ClickOutside from 'vue-click-outside';
import { includes, cloneDeep } from 'lodash-es';

export default {
  name: 'UiCompositeFilter',

  directives: {
    ClickOutside,
  },

  props: {
    filters: {
      type: Object,
      required: true,
    },
    scheme: {
      type: Object,
      required: true,
    },
    countsByFilter: {
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
      mainScheme: this.scheme.main.map(item => ({
        ...item,
        isExpanded: false,
      })),
      footerScheme: cloneDeep(this.scheme.footer),
      currentCheckers: this.scheme.currentCheckers,
    };
  },

  computed: {
    itemProps() {
      return {
        filters: this.filters,
        currentCheckers: this.currentCheckers,
        countsByFilter: this.countsByFilter,
      };
    },
  },

  watch: {
    isDropdownOpened(value) {
      if (!value) {
        this.mainScheme.forEach((item, index) => {
          this.mainScheme[index].isExpanded = false;
        });
      }
    },
  },

  methods: {
    getItemClass(item, parent) {
      const props = {
        ...parent,
        ...item,
      };
      const currentChecker = this.currentCheckers[props.filter];
      const isCurrent = currentChecker ? currentChecker(item, this.filters) : false;
      return [
        { _current: isCurrent },
        { _children: item.children },
        props.color ? `_color-${props.color}` : '',
        props.view ? `_view-${props.view}` : '',
        props.isCurrentClickable ? '_current-clickable' : '',
      ];
    },

    handleClick(item, parent) {
      if (item.children) {
        item.isExpanded = !item.isExpanded;
      } else {
        const props = {
          ...parent,
          ...item,
        };
        this.$emit('change', { filter: props.filter, value: props.value });
      }

      if (!parent && !item.children) {
        this.isDropdownOpened = false;
      }
    },
  },
};
</script>

<template>
  <div class="ui-composite-filter" v-click-outside="() => isDropdownOpened = false">
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
        <UiCompositeFilterItem
          v-for="(item, index) in mainScheme"
          type="main"
          :key="`main-${index}`"
          :item="item"
          v-bind="itemProps"
          @click="handleClick(item)"
        >
          <UiTip
            class="dropdown-child dropdown-content"
            v-if="item.children"
            :visible="item.isExpanded"
            :margin="0"
            position="bottom"
            innerPosition="left"
            width="200px"
          >
            <UiCompositeFilterItem
              v-for="(child, index) in item.children"
              :key="`child-${index}`"
              :item="child"
              :parent="item"
              v-bind="itemProps"
              @click="handleClick(child, item)"
            />
          </UiTip>
        </UiCompositeFilterItem>
        <UiCompositeFilterItem
          v-for="(item, index) in footerScheme"
          type="footer"
          :key="`footer-${index}`"
          :item="item"
          v-bind="itemProps"
          @click="handleClick(item)"
        />
      </div>
    </UiTip>
  </div>

</template>

<style lang="scss" scoped>
.ui-composite-filter {
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
</style>
