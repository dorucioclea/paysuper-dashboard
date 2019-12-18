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
    };
  },
  computed: {
    ...mapState('User', ['isAuthorised']),
  },
  mounted() {
    this.canvas = init404(window, this.$refs.canvas, this.$refs.world);
  },
  beforeDestroy() {
    this.canvas.deInit404();
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
  <canvas ref="world" class="world"></canvas>
  <canvas ref="canvas" class="canvas"></canvas>
  <div class="clouds">
    <div class="cloud x1"></div>
    <div class="cloud x2"></div>
    <div class="cloud x3"></div>
    <div class="cloud x4"></div>
    <div class="cloud x5"></div>
  </div>
  <div
    v-if="isAuthorised"
    class="back-box"
  >
    <RouterLink
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
  </div>
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
.world {
  z-index: 0;
  position: absolute;
  top: 60px;
  left: 0px;
}
.canvas {
  z-index: 1;
  position: absolute;
  top: 60px;
  left: 0px;
}
.link {
  text-decoration: none;

  &:hover > .title {
    transition: color 0.2s ease-out;
    color: #3d7bf5;
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
  bottom: 120px;
  z-index: 20;
}
.back-button {
  text-transform: uppercase;
}
.clouds {
  background-image: linear-gradient(180deg, #4bb8f0, transparent);
  overflow: hidden;
}
.cloud {
  width: 200px;
  height: 60px;
  background: #fff;
  border-radius: 200px;
  position: relative;
}
.cloud:before, .cloud:after {
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
