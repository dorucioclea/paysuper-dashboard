<script>
import { OpenFileDialog } from '@/helpers/uploader';
import getMessageFromError from '@/helpers/getMessageFromError';

export default {
  name: 'UiImageUpload',
  model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    title: {
      type: String,
      default: 'cover',
    },
    description: {
      type: String,
      default: '.png, .jpg, .jpeg, max size 30Mb, min 200x300px; max 1000x1500px',
    },
    uploadImage: {
      required: true,
      type: Function,
    },
    value: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    errorText: {
      default: 'Upload cover',
      type: String,
    },
    hasError: {
      default: false,
      type: Boolean,
    },
  },
  data() {
    return {
      isDragOver: false,
      errorMessage: '',
    };
  },
  computed: {
    /**
     * Error is visible if it exists and error text isn't empty
     * @return {boolean}
     */
    isVisibleError() {
      return !!(this.hasError && this.errorText);
    },
  },
  methods: {
    async uploadFile(file) {
      try {
        const { url } = await this.uploadImage(file);
        this.$emit('change', url);
      } catch (error) {
        let message = getMessageFromError(error);
        if (!message) {
          message = 'Unknown error';
          console.error(error);
        }
        this.errorMessage = message;
      }
    },
    dropFile(event) {
      if (this.disabled) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.isDragOver = false;
      this.uploadFile(event.dataTransfer.files[0]);
    },
    removeImage() {
      if (this.disabled) {
        return;
      }
      this.$emit('change', '');
    },
    handleAreaClick() {
      if (this.disabled) {
        return;
      }

      if (this.errorMessage) {
        this.errorMessage = '';
      } else {
        OpenFileDialog('image/*', this.uploadFile);
      }
    },
  },
};
</script>

<template>
<div
  class="ui-image-upload"
  :class="{'_disabled': disabled}"
  @click="handleAreaClick"
  @dragover.prevent="isDragOver = true"
  @dragleave="isDragOver = false"
  @drop.prevent="dropFile"
>
  <div
    class="image"
    :class="{'_no-image': !value}"
    :style="{backgroundImage: `url(${value})`}"
  >
    <span
      class="tag"
      v-if="tag"
    >
      {{ tag }}
    </span>
    <IconNoImage v-if="!value" width="22" height="22" fill="#C6CACC" />
  </div>
  <div
    class="info"
    :class="{ '_dragover': isDragOver, '_error': errorMessage }"
  >
    <template v-if="errorMessage">
      <div class="description">
        <IconWarning class="info-icon" />
        {{ errorMessage }}
      </div>
    </template>
    <template v-else>
      <UiUploadControls
        :title="title"
        :isFilled="Boolean(value)"
        :disabled="disabled"
        @delete.stop="removeImage"
      />
      <div class="description">
        {{ description }}
      </div>
    </template>

  </div>
  <span
    v-if="isVisibleError"
    class="error"
    :title="errorText"
    >
    {{ errorText }}
  </span>
</div>
</template>

<style scoped lang="scss">
$hover-text-color: #3d7bf5;
$error-text-color: #ea3d2f;
$secondary-input-size: 12px;
$left-indent: 80px;

.ui-image-upload {
  display: flex;
  cursor: pointer;
  position: relative;
  padding-bottom: 24px;

  &._disabled {
    cursor: default;
  }
}
.image {
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-size: cover;
  position: relative;
  border-radius: 4px;

  &._no-image {
    background-color: #f1f3f4;
  }
}
.error {
  bottom: 0;
  left: $left-indent;
  color: $error-text-color;
  display: block;
  font-size: $secondary-input-size;
  position: absolute;
}
.tag {
  position: absolute;
  font-size: 8px;
  line-height: 14px;
  font-weight: bold;
  letter-spacing: 1.5px;
  color: #fff;
  background: #000000;
  border-radius: 0 4px 0 4px;
  padding: 0 3px;
  top: 0;
  right: 0;

  .image._no-image & {
    background-color: #c6cacc;
  }
}

.title {
  font-size: 12px;
  line-height: 16px;
  color: #5e6366;
  padding-left: 12px;
  margin-bottom: 8px;
}

.info {
  width: 328px;
  margin-left: 17px;
  cursor: pointer;
  color: #919699;
  display: flex;
  justify-content: center;
  flex-direction: column;

  &._error {
    border-color: rgba($error-text-color, 0.48);
    color: $error-text-color;
  }
}

.info-icon {
  vertical-align: middle;
  margin-right: 4px;
}

.description {
  font-size: 12px;
  line-height: 16px;
  padding-top: 6px;
}

.upload-button,
.delete-button {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;

  & > svg {
    margin: 0 8px 0 0;
  }
}

.upload-button {
  color: #3d7bf5;

  & > svg {
    fill: #3d7bf5;
  }
}

.delete-button {
  color: #ea3d2f;

  &::before {
    content: "";
    width: 1px;
    height: 16px;
    background: #e3e5e6;
    margin: 0 16px;
  }
}
</style>
