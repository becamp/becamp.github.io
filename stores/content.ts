import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import moment from 'moment'
import { sortObjKeys } from '~/libs/util'
import { useRequestFetch } from '#app'

 type ButterPages = Record<string, Record<string, any>>

type Sponsor = {
  sponsor: string
  logo?: string | null
  url?: string | null
  write_up?: string | null
  level?: string | null
}

type Attendee = {
  name: string
  directory_permission: boolean
  key: string
}

type ScheduleItem = Record<string, any>

type CmsSnapshot = {
  pages: ButterPages
  sponsors: Sponsor[]
  attendees: Attendee[]
  schedule: ScheduleItem[]
}

const TWO_DIGIT_THRESHOLD = 10

const pad = (value: number) =>
  value >= TWO_DIGIT_THRESHOLD ? String(value) : `0${value >= 0 ? value : 0}`

let countdownTimer: number | null = null

export const useContentStore = defineStore('content', () => {
  const butterPages = ref<ButterPages>({})
  const sponsors = ref<Sponsor[]>([])
  const attendees = ref<Attendee[]>([])
  const schedule = ref<ScheduleItem[]>([])
  const currentPageAccentColor = ref('orange')
  const timeToEvent = ref<number | null>(null)
  const eventCountdownStarted = ref(false)
  const youtubeAPIReady = ref(false)
  const viewMode = ref('')
  const hydrated = ref(false)

  const eventTimeObject = computed(() => {
    if (timeToEvent.value === null) {
      return null
    }

    const duration = moment.duration(Math.max(timeToEvent.value, 0), 'milliseconds')

    return {
      months: pad(duration.months()),
      days: pad(duration.days()),
      hours: pad(duration.hours()),
      minutes: pad(duration.minutes()),
      seconds: pad(duration.seconds()),
    }
  })

  const premierSponsors = computed(() => {
    const premier = sponsors.value.filter(
      (sponsor) => sponsor.level && sponsor.level === 'Premier Sponsor',
    )

    const organized: Record<string, Sponsor> = {}
    premier.forEach((sponsor) => {
      organized[sponsor.sponsor] = sponsor
    })

    return sortObjKeys(organized)
  })

  const sponsorPartners = computed(() => {
    const sponsorLevels = ['Major Sponsor', 'Sponsor']
    const filtered = sponsors.value.filter(
      (sponsor) => sponsor.level && sponsorLevels.includes(sponsor.level),
    )

    const organized: Record<string, Sponsor> = {}
    filtered.forEach((sponsor) => {
      organized[sponsor.sponsor] = sponsor
    })

    return sortObjKeys(organized)
  })

  const supporterSponsors = computed(() => {
    const filtered = sponsors.value.filter(
      (sponsor) => sponsor.level && sponsor.level === 'Contributor',
    )

    const organized: Record<string, Sponsor> = {}
    filtered.forEach((sponsor) => {
      organized[sponsor.sponsor] = sponsor
    })

    return sortObjKeys(organized)
  })

  const directoryAttendees = computed(() =>
    attendees.value.filter((attendee) => attendee.directory_permission),
  )

  const attendeeCount = computed(() => attendees.value.length)

  const scheduleByTime = computed(() => {
    return schedule.value.reduce<Record<string, ScheduleItem[]>>((acc, entry) => {
      const slot = String(entry['Time'] ?? entry['time'] ?? '')
      if (!slot) {
        return acc
      }

      if (!acc[slot]) {
        acc[slot] = []
      }

      acc[slot].push(entry)
      return acc
    }, {})
  })

  function setButterPages(pages: ButterPages) {
    butterPages.value = pages
  }

  function setSponsors(value: Sponsor[]) {
    sponsors.value = value
  }

  function setAttendees(value: Attendee[]) {
    attendees.value = value
  }

  function setSchedule(value: ScheduleItem[]) {
    schedule.value = value
  }

  function setCurrentPageAccentColor(color: string) {
    currentPageAccentColor.value = color
  }

  function setViewMode(mode: string) {
    viewMode.value = mode
  }

  function setYoutubeReady(ready: boolean) {
    youtubeAPIReady.value = ready
  }

  function resetCountdown() {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    eventCountdownStarted.value = false
    timeToEvent.value = null
  }

  function decrementCountdown(intervalMs: number) {
    if (timeToEvent.value === null) {
      return
    }

    const updated = timeToEvent.value - intervalMs
    timeToEvent.value = updated > 0 ? updated : 0

    if (timeToEvent.value === 0) {
      resetCountdown()
    }
  }

  function setEventTime(target: string) {
    if (!target) {
      return
    }

    if (import.meta.server) {
      // countdown should only run in the browser
      return
    }

    const currentTime = moment()
    const targetMoment = moment(target, 'YYYY-M-D H:mm')

    if (!targetMoment.isValid()) {
      return
    }

    const diff = targetMoment.diff(currentTime)
    timeToEvent.value = diff > 0 ? diff : 0

    if (eventCountdownStarted.value || countdownTimer) {
      return
    }

    eventCountdownStarted.value = true
    countdownTimer = window.setInterval(() => {
      decrementCountdown(1000)
    }, 1000)
  }

  async function hydrate(force = false) {
    if (hydrated.value && !force) {
      return
    }

    const fetch = useRequestFetch()

    try {
      const snapshot = await fetch<CmsSnapshot>('/api/cms')
      setButterPages(snapshot.pages ?? {})
      setSponsors(snapshot.sponsors ?? [])
      setAttendees(snapshot.attendees ?? [])
      setSchedule(snapshot.schedule ?? [])
      hydrated.value = true
    } catch (error) {
      console.error('Failed to hydrate CMS snapshot', error)
      throw error
    }
  }

  return {
    // state
    butterPages,
    sponsors,
    attendees,
    schedule,
    currentPageAccentColor,
    timeToEvent,
    eventCountdownStarted,
    youtubeAPIReady,
    viewMode,
    hydrated,

    // getters
    eventTimeObject,
    premierSponsors,
    sponsorPartners,
    supporterSponsors,
    directoryAttendees,
    attendeeCount,
    scheduleByTime,

    // actions
    hydrate,
    setButterPages,
    setSponsors,
    setAttendees,
    setSchedule,
    setCurrentPageAccentColor,
    setViewMode,
    setYoutubeReady,
    setEventTime,
    resetCountdown,
  }
})
