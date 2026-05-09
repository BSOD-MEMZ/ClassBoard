<template>
  <mdui-card class="block settings-block">
    <div class="block-title">天气</div>
    <div class="form-grid">
      <div class="switch-row">
        <span>启用天气</span>
        <mdui-switch :checked="modelValue.weatherEnabled" @change="$emit('update:modelValue', { ...modelValue, weatherEnabled: $event.target.checked })"></mdui-switch>
      </div>
      <mdui-text-field label="城市名称" :value="modelValue.weatherCity" @input="$emit('update:modelValue', { ...modelValue, weatherCity: $event.target.value })"></mdui-text-field>
      <div class="split-2">
        <mdui-text-field label="纬度" type="number" step="0.0001" :value="modelValue.weatherLatitude" @input="$emit('update:modelValue', { ...modelValue, weatherLatitude: $event.target.value })"></mdui-text-field>
        <mdui-text-field label="经度" type="number" step="0.0001" :value="modelValue.weatherLongitude" @input="$emit('update:modelValue', { ...modelValue, weatherLongitude: $event.target.value })"></mdui-text-field>
      </div>
      <div class="city-search">
        <mdui-text-field label="搜索城市自动填经纬度" :value="cityQuery" @input="$emit('update:city-query', $event.target.value)"></mdui-text-field>
        <mdui-button variant="outlined" @click="$emit('search-city')">搜索</mdui-button>
      </div>
      <div v-if="cityLoading" class="tip">搜索中...</div>
      <div v-if="cityResults.length" class="city-results">
        <button v-for="city in cityResults" :key="city.id" type="button" class="city-item" @click="$emit('use-city', city)">
          <div class="city-name">{{ city.name }}</div>
          <div class="city-meta">{{ city.admin1 || city.country || '' }} · {{ Number(city.latitude).toFixed(2) }}, {{ Number(city.longitude).toFixed(2) }}</div>
        </button>
      </div>
    </div>
  </mdui-card>
</template>

<script setup lang="ts">
import type { CityResult } from '@/types'

interface WeatherDraft {
  weatherEnabled: boolean; weatherCity: string
  weatherLatitude: string; weatherLongitude: string
}
defineProps<{ modelValue: WeatherDraft; cityQuery: string; cityResults: CityResult[]; cityLoading: boolean }>()
defineEmits<{ 'update:modelValue': [value: WeatherDraft]; 'update:city-query': [value: string]; 'search-city': []; 'use-city': [city: CityResult] }>()
</script>

<style scoped>
.form-grid { display: grid; gap: 10px; margin-top: 10px; }
.switch-row { display: flex; justify-content: space-between; align-items: center; min-height: 44px; color: rgb(var(--mdui-color-on-surface-variant)); }
.split-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.city-search { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
.tip { margin-top: 8px; line-height: 1.45; color: rgb(var(--mdui-color-on-surface-variant)); font-size: var(--md3-body-medium); }
.city-results { display: grid; gap: 8px; }
.city-item { text-align: left; border: 1px solid color-mix(in srgb, rgb(var(--mdui-color-outline-variant)) 48%, transparent 52%); border-radius: 12px; background: color-mix(in srgb, rgb(var(--mdui-color-surface-container-high)) 86%, transparent 14%); padding: 10px; color: inherit; }
.city-name { font-weight: 500; }
.city-meta { margin-top: 4px; font-size: 0.84rem; color: rgb(var(--mdui-color-on-surface-variant)); }
</style>
