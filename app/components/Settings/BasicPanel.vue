<template>
  <mdui-card class="block settings-block">
    <div class="block-title">班牌与课表</div>
    <div class="form-grid">
      <mdui-text-field label="学校名称" :value="modelValue.schoolName" @input="$emit('update:modelValue', { ...modelValue, schoolName: $event.target.value })"></mdui-text-field>
      <mdui-text-field label="教室名称" :value="modelValue.classroomName" @input="$emit('update:modelValue', { ...modelValue, classroomName: $event.target.value })"></mdui-text-field>
      <div class="switch-row">
        <span>课表模式</span>
        <mdui-select :value="modelValue.scheduleMode" @change="$emit('update:modelValue', { ...modelValue, scheduleMode: $event.target.value })" style="min-width: 180px;">
          <mdui-menu-item value="simple">简单模式（单节课）</mdui-menu-item>
          <mdui-menu-item value="cses">CSES 模式（多课程）</mdui-menu-item>
        </mdui-select>
      </div>
      <template v-if="modelValue.scheduleMode === 'simple'">
        <div class="split-2">
          <mdui-text-field label="上课时间" type="time" :value="modelValue.classStart" @input="$emit('update:modelValue', { ...modelValue, classStart: $event.target.value })"></mdui-text-field>
          <mdui-text-field label="下课时间" type="time" :value="modelValue.classEnd" @input="$emit('update:modelValue', { ...modelValue, classEnd: $event.target.value })"></mdui-text-field>
        </div>
        <mdui-text-field class="json-field" textarea autosize rows="10" :value="modelValue.scheduleText" @input="$emit('update:modelValue', { ...modelValue, scheduleText: $event.target.value })"></mdui-text-field>
      </template>
      <template v-else>
        <div class="switch-row">
          <span>CSES 输入格式</span>
          <mdui-select :value="modelValue.csesFormat" @change="$emit('update:modelValue', { ...modelValue, csesFormat: $event.target.value })" style="min-width: 140px;">
            <mdui-menu-item value="auto">自动识别</mdui-menu-item>
            <mdui-menu-item value="yaml">YAML</mdui-menu-item>
            <mdui-menu-item value="json">JSON</mdui-menu-item>
          </mdui-select>
        </div>
        <mdui-text-field class="json-field" textarea autosize rows="12" placeholder="粘贴 CSES JSON/YAML" :value="modelValue.csesRaw" @input="$emit('update:modelValue', { ...modelValue, csesRaw: $event.target.value })"></mdui-text-field>
      </template>
      <mdui-text-field label="课前进度条分钟数" type="number" min="1" max="180" :value="modelValue.preClassProgressWindow" @input="$emit('update:modelValue', { ...modelValue, preClassProgressWindow: $event.target.value })"></mdui-text-field>
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
interface BasicDraft {
  schoolName: string; classroomName: string; scheduleMode: string
  classStart: string; classEnd: string; scheduleText: string
  csesFormat: string; csesRaw: string; preClassProgressWindow: string
}
defineProps<{ modelValue: BasicDraft }>()
defineEmits<{ 'update:modelValue': [value: BasicDraft] }>()
</script>

<style scoped>
.form-grid { display: grid; gap: 10px; margin-top: 10px; }
.switch-row { display: flex; justify-content: space-between; align-items: center; min-height: 44px; color: rgb(var(--mdui-color-on-surface-variant)); }
.split-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.json-field { margin-top: 10px; --mdui-shape-corner-extra-small: 14px; }
</style>
