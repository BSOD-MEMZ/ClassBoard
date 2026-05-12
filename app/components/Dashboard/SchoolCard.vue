<template>
  <m3e-card class="block school-block" variant="elevated">
    <div slot="content">
      <div class="school-name">{{ schoolName }}</div>
      <div class="classroom-name">{{ classroomName }}</div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
defineProps<{ schoolName: string; classroomName: string }>();
</script>

<style scoped>
.school-name {
  font-size: var(--md3-title-large);
  font-weight: 500;
  color: var(--app-seed-color, var(--md-sys-color-on-primary-container));
}

.classroom-name {
  margin-top: 6px;
  font-size: clamp(1.1rem, 4.6vw, 1.45rem);
  line-height: 1.3;
  font-weight: 600;
  color: var(--md-sys-color-primary) !important;
}
</style>
