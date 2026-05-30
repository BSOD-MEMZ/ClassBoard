<template>
  <m3e-card class="block settings-block" variant="elevated">
    <div slot="header" class="block-title">天气</div>
    <div slot="content" class="form-grid">
      <div class="switch-row">
        <span>
          <Icon name="material-symbols:partly-cloudy-day-outline" class="label-icon" />
          启用天气
        </span>
        <m3e-switch
          icons="both"
          :selected="modelValue.weatherEnabled"
          @click="
            $emit('update:modelValue', {
              ...modelValue,
              weatherEnabled: !modelValue.weatherEnabled,
            })
          "
        ></m3e-switch>
      </div>
      <m3e-form-field>
        <label slot="label" for="weather-city">城市名称</label>
        <input
          id="weather-city"
          class="text-input"
          :value="modelValue.weatherCity"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              weatherCity: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </m3e-form-field>
      <div class="split-2">
        <m3e-form-field>
          <label slot="label" for="weather-lat">纬度</label>
          <input
            id="weather-lat"
            class="text-input"
            type="number"
            step="0.0001"
            :value="modelValue.weatherLatitude"
            @input="
              $emit('update:modelValue', {
                ...modelValue,
                weatherLatitude: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </m3e-form-field>
        <m3e-form-field>
          <label slot="label" for="weather-lon">经度</label>
          <input
            id="weather-lon"
            class="text-input"
            type="number"
            step="0.0001"
            :value="modelValue.weatherLongitude"
            @input="
              $emit('update:modelValue', {
                ...modelValue,
                weatherLongitude: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </m3e-form-field>
      </div>
      <div class="city-search">
        <m3e-form-field>
          <label slot="label" for="city-search">搜索城市自动填经纬度</label>
          <input
            id="city-search"
            class="text-input"
            :value="cityQuery"
            @input="
              $emit(
                'update:city-query',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </m3e-form-field>
        <m3e-button variant="outlined" @click="$emit('search-city')"
          >搜索</m3e-button
        >
      </div>
      <div v-if="cityLoading" class="tip">搜索中...</div>
      <div v-if="cityResults.length" class="city-results">
        <button
          v-for="city in cityResults"
          :key="city.id"
          type="button"
          class="city-item"
          @click="$emit('use-city', city)"
        >
          <div class="city-name">{{ city.name }}</div>
          <div class="city-meta">
            {{ city.admin1 || city.country || "" }} ·
            {{ Number(city.latitude).toFixed(2) }},
            {{ Number(city.longitude).toFixed(2) }}
          </div>
        </button>
      </div>
    </div>
  </m3e-card>
</template>

<script setup lang="ts">
import type { CityResult } from "@/types";

interface WeatherDraft {
  weatherEnabled: boolean;
  weatherCity: string;
  weatherLatitude: string;
  weatherLongitude: string;
}
defineProps<{
  modelValue: WeatherDraft;
  cityQuery: string;
  cityResults: CityResult[];
  cityLoading: boolean;
}>();
defineEmits<{
  "update:modelValue": [value: WeatherDraft];
  "update:city-query": [value: string];
  "search-city": [];
  "use-city": [city: CityResult];
}>();
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
  color: var(--md-sys-color-on-surface-variant);
}

.switch-row span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.split-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.city-search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font: inherit;
  padding: 4px 0;
}

.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md3-body-medium);
}

.city-results {
  display: grid;
  gap: 8px;
}

.city-item {
  text-align: left;
  border: 1px solid
    color-mix(in srgb, var(--md-sys-color-outline-variant) 48%, transparent 52%);
  border-radius: 12px;
  background: color-mix(
    in srgb,
    var(--md-sys-color-surface-container-high) 86%,
    transparent 14%
  );
  padding: 10px;
  color: inherit;
  cursor: pointer;
}

.city-name {
  font-weight: 500;
}

.city-meta {
  margin-top: 4px;
  font-size: 0.84rem;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
