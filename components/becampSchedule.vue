<template>
  <div class="becamp-schedule">
    <div
      class="time-block"
      :data-time="[time]"
      v-for="(events, time) in scheduleMap"
      :key="time"
    >
      <h3 class="event-time">{{time}}</h3>

      <div class="event-cards">
        <div
          class="event"
          v-for="(event, eventIndex) in events"
          :key="String(event['Location'] ?? eventIndex)"
          :data-location="getLocationID(event['Location'])"
        >
          <div class="event-data">
            <h4 class="topic">{{ event['Topic'] }}</h4>
            <span
              class="speaker"
              v-if="event['Speaker']"
            >
              {{ event['Speaker'] }}
            </span>
          </div>
          <div class="event-location-wrapper">
            <span
              class="type"
              v-if="event['Type']"
            >
              {{ event['Type'] }}
            </span>
            <div class="event-location">
              <span class="location">{{ getLocationID(event['Location']) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useContentStore } from '~/stores/content'

const contentStore = useContentStore()
const { scheduleByTime } = storeToRefs(contentStore)

type ScheduleEntry = Record<string, any>
type ScheduleMap = Record<string, ScheduleEntry[]>

const scheduleMap = computed<ScheduleMap>(() => scheduleByTime.value as ScheduleMap)

const getLocationID = (location: unknown) => {
  if (typeof location !== 'string') {
    return ''
  }

  const roomColor = location.substring(0, location.indexOf(' Room'))
  return roomColor || location
}
</script>

<style lang="scss" scoped>
@use "sass:color";

.event-time {
  color: $accent4;
}
.event-cards {
  display: flex;
  flex-direction: column;

  @include bp($m) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .event {
    padding: calc(gutter() / 2);
    border: 1px solid #f5f5f5;
    border-radius: 5px;
    box-shadow: 0 .25em 1em 0 rgba($dark, .1);
    margin-bottom: gutter();
    display: flex;
    justify-content: space-between;
    align-items: center;

    @include bp($m) {
      padding: gutter();
      width: 49%;
      border-radius: 15px;
      margin-bottom: gutter();
    }

    &[data-location="Red"] {
      .event-location {
        color: #fff;
        background: linear-gradient(to bottom, red, color.scale(red, $lightness: -5%)) !important;
      }
    }
    &[data-location="Black"] {
      .event-location {
        color: #fff;
        background: linear-gradient(to bottom, #555, color.scale(#555, $lightness: -5%)) !important;
      }
    }
    &[data-location="Brown"] {
      .event-location {
        color: #fff;
        background: linear-gradient(to bottom, #885e27, color.scale(#885e27, $lightness: -5%)) !important;
      }
    }
    &[data-location="Pink"] {
      .event-location {
        color: #222;
        background: linear-gradient(to bottom, pink, color.scale(pink, $lightness: -5%)) !important;
      }
    }
    &[data-location="Blue"] {
      .event-location {
        color: #fff;
        background: linear-gradient(to bottom, #446b97, color.scale(#446b97, $lightness: -5%)) !important;
      }
    }
    &[data-location="6"] {
      .event-location {
        color: $dark;
        background: linear-gradient(to bottom, $light-d, color.scale($light-d, $lightness: -8%)) !important;
      }
    }

    .event-data {
      margin-right: calc(gutter() / 2);
      width: 65%;

      .topic {
        margin: 0;
        font-weight: bold;
        line-height: 1;
        margin-bottom: calc(gutter() / 4);
      }
      .speaker {
        color: #666;
        font-size: 1rem;
      }
    }
    .event-location-wrapper {
      width: 35%;
      font-size: .9rem;
      text-align: center;

      .type {
        background-color: #f5f5f5;
        border: 1px solid #aaa;
        border-radius: 3px;
        padding: .25em .5em;
        display: inline-block;
        margin: 0 auto .5em auto;
      }

      .event-location {
        text-align: center;
        padding: calc(gutter() / 2);
        background: #eee;
        border-radius: 5px;
      }
    }
  }
}
</style>
