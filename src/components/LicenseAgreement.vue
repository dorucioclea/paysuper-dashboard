<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import Notifications from '@/mixins/Notifications';

export default {
  name: 'LicenseAgreement',
  mixins: [Notifications],
  computed: {
    ...mapGetters('User/Merchant', ['isOnboardingStepsComplete']),
    ...mapGetters('Company/LicenseAgreement', ['isSigendYou', 'isSigendPS']),
    ...mapState('Company/LicenseAgreement', [
      'document',
      'agreement',
      'isAgreementLoading',
    ]),

    isCheckingAgreement() {
      return this.isSigendYou && !this.isSigendPS;
    },
    titleSignedYou() {
      return this.isSigendYou ? 'Signed by you' : 'Not signed by you';
    },
    titleSignedPs() {
      return this.isSigendPS ? 'Signed by PaySuper' : 'Not signed by PaySuper';
    },
    statusSignedYou() {
      if (!this.isSigendYou) {
        return 'In progress';
      }

      return 'Done';
    },
    statusSignedPS() {
      if (this.isCheckingAgreement) {
        return 'Checking agreement…';
      }

      if (!this.isSigendPS) {
        return 'Waiting for your sign';
      }

      return 'Done';
    },
  },
  async mounted() {
    try {
      await this.initState(this.isOnboardingStepsComplete);
    } catch (error) {
      this.$_Notifications_showErrorMessage(error);
    }
  },
  methods: {
    ...mapActions('Company/LicenseAgreement', ['initState', 'uploadDocument']),
  },
};
</script>

<template>
<div class="license-agreement">
  <div class="section">
    <div class="info">
      License Agreement signing procedure is initiated and document signing instructions are sent
      to your Company Representative’s e-mail. Please make sure this person received the e-mail
      and has authority to sign legal documentation. For e-signing we use “Hellosign” service,
      which provides legally binding electronic signatures.
    </div>

    <div class="container">
      <div v-if="isSigendYou && isSigendPS" class="item">
        <IconFile v-if="agreement.metadata.size" />
        <IconFileLoader v-else />
        <div class="item-text _file">
          <div class="first-line">License Agreement.{{ agreement.metadata.extension }}</div>
          <a
            v-if="agreement.metadata.size"
            :class="['second-line', '_link', { '_disabled': isAgreementLoading }]"
            :href="agreement.url"
            @click.prevent="uploadDocument"
          >
            DOWNLOAD
            <UiSimplePreloader
              v-if="isAgreementLoading"
              class="agreement-preloader"
            />
          </a>
        </div>
      </div>
      <div class="item">
        <component :is="`Icon${isSigendYou ? '' : 'Not'}Signed`" />
        <div class="item-text">
          <div
            :class="['first-line', {
              '_not-signed': !isSigendYou,
              '_signed': isSigendYou,
            }]">
            {{ titleSignedYou }}
          </div>
          <div class="second-line">{{ statusSignedYou }}</div>
        </div>
      </div>
      <div class="item">
        <component
          :is="`Icon${isSigendPS ? '' : 'Not'}Signed`"
          :class="['icon-sign-ps', { '_checking': isCheckingAgreement }]"
        />
        <div class="item-text">
          <div
            :class="['first-line', {
              '_not-signed': !isSigendPS,
              '_signed': isSigendPS,
              '_checking': isCheckingAgreement,
            }]">
            {{ titleSignedPs }}
          </div>
          <div class="second-line">{{ statusSignedPS }}</div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
.license-agreement {
  display: flex;
  flex-direction: column;
}
.section {
  margin-bottom: 12px;
}
.info {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.25px;
  color: #5e6366;
  margin-bottom: 20px;
  max-width: 548px;
}
.container {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
}
.item {
  display: flex;
  padding-top: 4px;
  padding-bottom: 4px;
  margin-bottom: 16px;

  &:not(:last-child) {
    padding-right: 48px;
    margin-right: 48px;
    border-right: 1px solid #e3e5e6;
  }
}
.icon-sign-ps {
  &._checking {
    fill: #f3aa18;
  }
}
.item-text {
  margin-left: 8px;

  &._file {
    margin-left: 16px;
  }
}
.first-line {
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.1px;
  color: #3e4345;
  margin-bottom: 8px;

  &._signed {
    color: #069697;
  }
  &._not-signed {
    color: #ea3d2f;
  }
  &._checking {
    color: #f3aa18;
  }
}
.second-line {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.25px;
  color: #919699;

  &._link {
    color: #3d7bf5;
    letter-spacing: 0.75px;
    font-weight: 500;
    display: flex;

    &._disabled {
      pointer-events: none;
      cursor: default;
      color: #5e6366;
    }
  }
}
.agreement-preloader {
  margin-left: 12px;
}
.submit {
  min-width: 180px;
  align-self: flex-end;
  letter-spacing: 0.75px;
}
</style>
