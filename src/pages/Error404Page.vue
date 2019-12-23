<script>
import { mapState } from 'vuex';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import init404 from '@/plugins/init404';

export default {
  name: 'Error404Page',
  components: {
    LocaleSwitcher,
  },
  data() {
    return {
      canvas: null,
      isCoolPageView: false,
    };
  },
  computed: {
    ...mapState('User', ['isAuthorised']),
    ...mapState(['config']),

    supportMail() {
      return this.config.supportMail;
    },
  },
  beforeDestroy() {
    if (this.canvas) {
      this.canvas.destroy404();
    }
  },
  methods: {
    togglePageView() {
      this.isCoolPageView = !this.isCoolPageView;

      if (this.isCoolPageView) {
        this.$nextTick(() => {
          this.canvas = init404(window, this.$refs.canvas, this.$refs.world);
        });
      }
    },
  },
};
</script>

<template>
<div class="error-404">
  <div class="header">
    <RouterLink
      class="link"
      to="/"
      title="PaySuper"
    >
      <h1 class="title">PaySuper</h1>
    </RouterLink>
    <div class="menu">
      <RouterLink
        v-if="isAuthorised"
        class="link"
        to="/logout"
        title="Log out"
      >
        <IconLogoutShallow class="logout" />
      </RouterLink>
      <LocaleSwitcher listColor="white" />
    </div>
  </div>

  <UiTransitionFade>
    <div
      v-if="isCoolPageView"
      class="main"
    >
      <canvas ref="world" class="world"></canvas>
      <canvas ref="canvas" class="canvas"></canvas>
      <div class="clouds">
        <div class="cloud x1"></div>
        <div class="cloud x2"></div>
        <div class="cloud x3"></div>
        <div class="cloud x4"></div>
        <div class="cloud x5"></div>
      </div>

      <div class="back-box">
        <RouterLink
          v-if="isAuthorised"
          class="link"
          to="/dashboard"
          title="Dashboard"
        >
          <UiButton
            class="back-button"
            color="cyan"
          >
            {{ $t('backToDashboard') }}
          </UiButton>
        </RouterLink>

        <IconBigArrow
          class="back-icon"
          @click.native="togglePageView"
        />
      </div>
    </div>
    <div
      v-else
      class="main"
    >
      <div
        class="img-404"
        @click="togglePageView"
      ></div>

      <div class="title-main">
        {{ $t('pageNotFound') }}
      </div>

      <div class="desc-main">
        {{ $t('pageNotFoundDesc') }}
      </div>

      <RouterLink
        v-if="isAuthorised"
        class="link"
        to="/dashboard"
        title="Dashboard"
      >
        <UiButton class="back-button">
          {{ $t('backToDashboard') }}
        </UiButton>
      </RouterLink>

      <a
        class="link _mail"
        :href="`mailto:${supportMail}`"
        :title="supportMail"
      >
        {{ $t('pageNotFoundContact') }}
      </a>
    </div>
  </UiTransitionFade>
</div>
</template>

<style lang="scss" scoped>
.error-404 {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: hidden;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 24px;
}
.main {
  position: absolute;
  left: 0;
  top: 60px;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.img-404 {
  cursor: pointer;
  width: 260px;
  height: 260px;
  background-image: url('../assets/images/404.png');
  background-size: contain;
  margin-bottom: 32px;
  transition: transform 0.3s ease-out;
  margin-top: -120px;

  &:hover {
    transform: translate3d(0, -10px, 0);
  }
}
.title-main {
  font-size: 34px;
  line-height: 42px;
  letter-spacing: 0.25px;
  font-family: "Quicksand", sans-serif;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 12px;
}
.desc-main {
  font-family: Roboto;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  letter-spacing: 0.25px;
  color: #5e6366;
  max-width: 448px;
  margin-bottom: 32px;
}
.world {
  z-index: 0;
  position: absolute;
  top: 0;
  left: 0;
}
.canvas {
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
}
.link {
  text-decoration: none;

  &:hover > .title {
    transition: color 0.2s ease-out;
    color: #3d7bf5;
  }

  &._mail {
    color: #367bf5;
    transition: color 0.2s ease-out;

    &:hover {
      color: #367bf5;
    }
  }
}
.title {
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  color: #000;
  font-family: "Quicksand", sans-serif;
  transition: color 0.2s ease-out;
}
.menu {
  display: flex;
  align-items: center;
}
.logout {
  fill: #363636;
  margin-right: 18px;
  margin-top: -2px;
  cursor: pointer;
  vertical-align: middle;

  &:hover {
    fill: #3d7bf5;
  }
}
.back-box {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 180px;
  z-index: 20;
  flex-direction: column;
}
.back-button {
  text-transform: uppercase;
  margin-bottom: 20px;
}
.back-icon {
  display: inline-block;
  transform: rotate(180deg);
  cursor: pointer;
}
.clouds {
  background-image: linear-gradient(180deg, #4bb8f0, transparent);
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
.cloud {
  width: 200px;
  height: 60px;
  background: #fff;
  border-radius: 200px;
  position: relative;
}
.cloud:before,
.cloud:after {
  content: '';
  position: absolute;
  background: #fff;
  width: 100px;
  height: 80px;
  position: absolute;
  top: -5px;
  left: 10px;
  border-radius: 100px;
  transform: rotate(30deg);
}
.cloud:after {
  width: 120px;
  height: 120px;
  top: -50px;
  left: auto;
  right: 15px;
}
.x1 {
  animation: moveclouds 30s linear infinite;
}
.x2 {
  left: 200px;
  transform: scale(0.6);
  opacity: 0.6;
  animation: moveclouds 80s linear infinite;
}
.x3 {
  left: -250px;
  top: -30px;
  transform: scale(0.8);
  opacity: 0.8;
  animation: moveclouds 40s linear infinite;
}
.x4 {
  left: 470px;
  top: -80px;
  transform: scale(0.75);
  opacity: 0.75;
  animation: moveclouds 55s linear infinite;
}
.x5 {
  left: -150px;
  top: -20px;
  transform: scale(0.8);
  opacity: 0.8;
  animation: moveclouds 68s linear infinite;
}
@keyframes moveclouds {
  0% { margin-left: 800px; }
  100% { margin-left: -800px; }
}
</style>
