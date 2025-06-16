<template>
  <router-view></router-view> <!-- 라우터가 해당 위치에 컴포넌트를 렌더링합니다 -->
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
});
</script>

<style>
.mainbody {
  color: white;
  min-height: 100vh;
}
#app {
  text-align: center;
}
</style>
