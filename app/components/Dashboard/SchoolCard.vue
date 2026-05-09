<template>
  <mdui-card class="block school-block">
    <div class="school-name">{{ schoolName }}</div>
    <div class="classroom-name">{{ classroomName }}</div>
  </mdui-card>
</template>

<script setup lang="ts">
defineProps<{ schoolName: string; classroomName: string }>()
</script>

<style scoped>
.school-name { font-size: var(--md3-title-large); font-weight: 500; color: var(--app-seed-color, rgb(var(--mdui-color-on-primary-container))); }
.classroom-name { margin-top: 6px; font-size: clamp(1.1rem, 4.6vw, 1.45rem); line-height: 1.3; font-weight: 600; color: rgb(var(--mdui-color-primary)) !important; }
</style>
