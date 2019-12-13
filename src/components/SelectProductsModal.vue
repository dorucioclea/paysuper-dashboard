<script>
import { includes } from 'lodash-es';

export default {
  name: 'SelectProductsModal',

  model: {
    event: 'update',
    prop: 'value',
  },

  data() {
    return {
      newList: [],
    };
  },

  props: {
    title: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    options: {
      type: Array,
      required: true,
    },
    value: {
      type: Array,
      required: true,
    },
  },

  computed: {
    isCanAdd() {
      return this.value.length < 8;
    },
  },

  watch: {
    items() {
      this.newList = [];
    },
  },

  methods: {
    includes,

    getInclude(itemValue) {
      const list = this.value
        .filter(item => itemValue === item.id);

      return list.length !== 0;
    },

    toggleItemSelected(itemValue) {
      const newItems = this.value
        .filter(el => itemValue === el.id);
      const item = this.items
        .filter(el => itemValue === el.id);

      if (newItems.length === 0 && this.isCanAdd) {
        this.newList.push(item[0]);
      } else {
        this.newList = this.value
          .filter(el => itemValue !== el.id);
      }

      this.$emit('updated', this.newList);
    },

    save() {
      this.$emit('save', this.value);
    },
  },
};
</script>

<template>
<UiModal
  width="458px"
  :hasCloseButton="true"
  @close="$emit('close')"
>
  <UiHeader
    slot="header"
    level="3"
    align="center"
  >
    {{ title }}
  </UiHeader>

  <slot/>

  <UiScrollbarBox class="content">
    <div
      v-for="(option, index) in options"
      class="item"
      :key="index"
      :class="{
        '_selected': getInclude(option.value),
      }"
      @click.self="toggleItemSelected(option.value)"
    >
      <div class="icon" v-if="option.iconComponent">
        <component :is="option.iconComponent" />
      </div>

      <div class="label"
        @click="toggleItemSelected(option.value)"
      >
        {{ option.label }}
      </div>

      <span
        class="delete-icon"
        @click="toggleItemSelected(option.value)"
      >
        <IconCloseInCircle />
      </span>

      <span
        v-if="isCanAdd"
        class="add-icon"
        @click="toggleItemSelected(option.value)"
      >
        <IconPlusInCircle />
      </span>
    </div>
  </UiScrollbarBox>
  <div class="controls">
    <UiButton
      class="submit-button"
      @click="save"
    >
      SAVE
    </UiButton>
  </div>
</UiModal>
</template>

<style lang="scss" scoped>
.content {
  max-height: 295px;
  margin-right: -20px;
  margin-bottom: 10px;
}

.item {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 48px;
  font-size: 16px;
  line-height: 24px;
  border-bottom: 1px solid #e3e5e6;
  margin-right: 20px;
  padding-right: 20px;
  position: relative;

  &:not(._selected):hover {
    background-color: rgba(#3d7bf5, 0.1);
    color: #3d7bf5;
    .add-icon {
      display: flex;
    }
  }

  &._selected {
    color: #919699;
    cursor: default;

    .delete-icon {
      display: flex;
    }

    .add-icon {
      display: none;
    }

    .icon {
      opacity: 0.3;
    }
  }

  &._undeletable {
    cursor: default;

    .delete-icon {
      display: none;
    }
  }
}
.icon {
  border-radius: 3px;
  overflow: hidden;
  height: 18px;
  flex-shrink: 0;
  margin: -1px 10px 0 0;
}
.label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.add-icon,
.delete-icon {
  position: absolute;
  display: none;
  right: 0;
  top: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  justify-content: center;
  align-items: center;
}
.delete-icon {
  & > svg {
    transition: fill 0.15s ease-out;
  }

  &:hover > svg {
    fill: #ea3d2f;
  }
}

.controls {
  display: flex;
}
.submit-button {
  flex-grow: 1;
}
</style>
